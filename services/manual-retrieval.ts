/**
 * Gear AI CoPilot - Owner's Manual Retrieval Service
 *
 * Orchestrates manual lookup across multiple sources:
 *   1. Local Supabase cache (fastest)
 *   2. VehicleDatabases.com Owner's Manual API (primary commercial source)
 *   3. NHTSA Recalls API (supplementary safety data)
 *   4. Web search fallback for OEM PDF links
 *
 * Also exposes helpers for NHTSA safety ratings and recall checks.
 */

import {
  VehicleLookup,
  ManualRetrievalResult,
  VehicleDatabasesResponse,
  NHTSARecall,
  RecallResult,
  SafetyRating,
  SafetyRatingResult,
  CachedManualLookup,
} from '../types/manual';
import { VINDecodeResult } from '../types/vehicle';
import { decodeVIN } from './vin-decoder';
import supabase from '../lib/supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api';
const NHTSA_RECALLS_BASE = 'https://api.nhtsa.gov/recalls/recallsByVehicle';
const NHTSA_SAFETY_BASE = 'https://api.nhtsa.gov/SafetyRatings';
const VEHICLE_DATABASES_BASE = 'https://api.vehicledatabases.com/owner-manual';

/** Cache TTL – 30 days in milliseconds */
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a deterministic cache key from a vehicle lookup.
 */
function buildCacheKey(v: VehicleLookup): string {
  const parts = [
    v.year.toString(),
    v.make.toLowerCase().trim(),
    v.model.toLowerCase().trim(),
  ];
  if (v.trim) parts.push(v.trim.toLowerCase().trim());
  return `manual:${parts.join(':')}`;
}

/**
 * Fetch with a timeout guard.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 1. Local cache layer (Supabase api_cache table)
// ---------------------------------------------------------------------------

async function getFromCache(key: string): Promise<CachedManualLookup | null> {
  try {
    const { data, error } = await supabase
      .from('api_cache')
      .select('*')
      .eq('cache_key', key)
      .single();

    if (error || !data) return null;

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      // Expired – clean up in background
      supabase.from('api_cache').delete().eq('cache_key', key).then(() => {});
      return null;
    }

    return data.data as CachedManualLookup;
  } catch {
    return null;
  }
}

async function writeToCache(entry: CachedManualLookup): Promise<void> {
  try {
    await supabase.from('api_cache').upsert({
      cache_key: entry.cache_key,
      data: entry,
      created_at: new Date().toISOString(),
      expires_at: entry.expires_at,
    });
  } catch (err) {
    console.warn('[ManualRetrieval] Cache write failed:', err);
  }
}

// ---------------------------------------------------------------------------
// 2. VehicleDatabases.com API
// ---------------------------------------------------------------------------

/**
 * Query VehicleDatabases.com Owner's Manual API.
 *
 * Supports lookup by VIN or by Year/Make/Model.
 * Requires VEHICLE_DATABASES_API_KEY env var.
 */
async function queryVehicleDatabases(
  vehicle: VehicleLookup
): Promise<ManualRetrievalResult | null> {
  const apiKey = process.env.VEHICLE_DATABASES_API_KEY;
  if (!apiKey) {
    console.warn('[ManualRetrieval] VEHICLE_DATABASES_API_KEY not set – skipping VehicleDatabases lookup.');
    return null;
  }

  try {
    let url: string;
    if (vehicle.vin) {
      url = `${VEHICLE_DATABASES_BASE}/vin/${encodeURIComponent(vehicle.vin)}`;
    } else {
      url = `${VEHICLE_DATABASES_BASE}/${vehicle.year}/${encodeURIComponent(vehicle.make)}/${encodeURIComponent(vehicle.model)}`;
    }

    const res = await fetchWithTimeout(url, {
      headers: {
        'x-AuthKey': apiKey,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`[ManualRetrieval] VehicleDatabases responded ${res.status}`);
      return null;
    }

    const json: VehicleDatabasesResponse = await res.json();

    if (json.status !== 'success' || !json.data?.owner_manual_url) {
      return null;
    }

    return {
      source: 'vehicledatabases',
      vehicle,
      manual_url: json.data.owner_manual_url,
      manual_title: `${json.data.year} ${json.data.make} ${json.data.model} Owner's Manual`,
      retrieved_at: new Date().toISOString(),
      cached: false,
    };
  } catch (err) {
    console.warn('[ManualRetrieval] VehicleDatabases query failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. Web search fallback – OEM manual URL patterns
// ---------------------------------------------------------------------------

/**
 * OEM manual URL patterns for direct PDF access.
 * These are publicly available consumer download pages.
 */
const OEM_MANUAL_PATTERNS: Record<string, (year: number, model: string) => string> = {
  ford: (year, model) =>
    `https://www.fordservicecontent.com/Ford_Content/Catalog/owner_information/${year}-Ford-${encodeURIComponent(model)}-Owners-Manual.pdf`,
  lincoln: (year, model) =>
    `https://www.fordservicecontent.com/Ford_Content/Catalog/owner_information/${year}-Lincoln-${encodeURIComponent(model)}-Owners-Manual.pdf`,
  toyota: (year, _model) =>
    `https://www.toyota.com/t3Portal/document/om-s/${year.toString().slice(-2)}/pdf/en/OM.pdf`,
  honda: (year, model) =>
    `https://techinfo.honda.com/rNavigator/document.aspx?DocumentID=${year}_${encodeURIComponent(model)}_OM`,
};

/**
 * Attempt to construct a direct OEM URL for the manual.
 * This is best-effort and may 404 for many models.
 */
async function tryOemFallback(vehicle: VehicleLookup): Promise<ManualRetrievalResult | null> {
  const makeKey = vehicle.make.toLowerCase().trim();
  const patternFn = OEM_MANUAL_PATTERNS[makeKey];
  if (!patternFn) return null;

  try {
    const url = patternFn(vehicle.year, vehicle.model);
    // HEAD request to verify the URL resolves
    const res = await fetchWithTimeout(url, { method: 'HEAD' }, 8_000);
    if (res.ok) {
      return {
        source: 'oem_fallback',
        vehicle,
        manual_url: url,
        manual_title: `${vehicle.year} ${vehicle.make} ${vehicle.model} Owner's Manual`,
        retrieved_at: new Date().toISOString(),
        cached: false,
      };
    }
  } catch {
    // Expected – URL pattern didn't match
  }

  return null;
}

/**
 * Build a Google-style search URL for the user to find the manual.
 * This is the last resort and does not auto-fetch.
 */
function buildWebSearchFallbackUrl(vehicle: VehicleLookup): string {
  const q = encodeURIComponent(
    `${vehicle.year} ${vehicle.make} ${vehicle.model} owner's manual PDF filetype:pdf`
  );
  return `https://www.google.com/search?q=${q}`;
}

// ---------------------------------------------------------------------------
// 4. NHTSA Recalls API (supplementary safety data)
// ---------------------------------------------------------------------------

/**
 * Fetch NHTSA recall campaigns for a vehicle.
 * Free, no API key required.
 */
export async function getRecalls(vehicle: VehicleLookup): Promise<RecallResult> {
  const now = new Date().toISOString();
  try {
    const url = `${NHTSA_RECALLS_BASE}?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&modelYear=${vehicle.year}`;
    const res = await fetchWithTimeout(url);

    if (!res.ok) {
      return { recalls: [], count: 0, vehicle, retrieved_at: now };
    }

    const json = await res.json();
    const recalls: NHTSARecall[] = (json.results || []).map((r: any) => ({
      NHTSACampaignNumber: r.NHTSACampaignNumber || '',
      ReportReceivedDate: r.ReportReceivedDate || '',
      Component: r.Component || '',
      Summary: r.Summary || '',
      Consequence: r.Consequence || '',
      Remedy: r.Remedy || '',
      Manufacturer: r.Manufacturer || '',
      ModelYear: r.ModelYear || '',
      Make: r.Make || '',
      Model: r.Model || '',
    }));

    return { recalls, count: recalls.length, vehicle, retrieved_at: now };
  } catch (err) {
    console.warn('[ManualRetrieval] NHTSA recalls fetch failed:', err);
    return { recalls: [], count: 0, vehicle, retrieved_at: now };
  }
}

// ---------------------------------------------------------------------------
// 5. NHTSA Safety Ratings API
// ---------------------------------------------------------------------------

/**
 * Fetch NHTSA 5-star safety ratings for a vehicle.
 * Free, no API key required.
 */
export async function getSafetyRatings(vehicle: VehicleLookup): Promise<SafetyRatingResult> {
  const now = new Date().toISOString();
  try {
    const url = `${NHTSA_SAFETY_BASE}/modelyear/${vehicle.year}/make/${encodeURIComponent(vehicle.make)}/model/${encodeURIComponent(vehicle.model)}?format=json`;
    const res = await fetchWithTimeout(url);

    if (!res.ok) {
      return { ratings: [], vehicle, retrieved_at: now };
    }

    const json = await res.json();
    const ratings: SafetyRating[] = (json.Results || []).map((r: any) => ({
      OverallRating: r.OverallRating || 'Not Rated',
      OverallFrontCrashRating: r.OverallFrontCrashRating || 'Not Rated',
      OverallSideCrashRating: r.OverallSideCrashRating || 'Not Rated',
      RolloverRating: r.RolloverRating || 'Not Rated',
      VehicleDescription: r.VehicleDescription || '',
      VehicleId: r.VehicleId || 0,
    }));

    return { ratings, vehicle, retrieved_at: now };
  } catch (err) {
    console.warn('[ManualRetrieval] NHTSA safety ratings fetch failed:', err);
    return { ratings: [], vehicle, retrieved_at: now };
  }
}

// ---------------------------------------------------------------------------
// 6. Orchestrator – resolve vehicle and retrieve manual
// ---------------------------------------------------------------------------

/**
 * Resolve a VIN into a VehicleLookup using the existing VIN decoder.
 */
export async function resolveVehicle(
  vinOrLookup: string | VehicleLookup
): Promise<VehicleLookup> {
  if (typeof vinOrLookup === 'object') return vinOrLookup;

  const decoded: VINDecodeResult = await decodeVIN(vinOrLookup);
  return {
    vin: decoded.vin,
    year: decoded.year,
    make: decoded.make,
    model: decoded.model,
    trim: decoded.trim,
  };
}

/**
 * Primary entry point – retrieve an owner's manual for a vehicle.
 *
 * Lookup waterfall:
 *   1. Local Supabase cache
 *   2. VehicleDatabases.com API (if API key present)
 *   3. Direct OEM URL pattern
 *   4. Web search fallback URL
 *
 * The first non-null result is cached and returned.
 */
export async function retrieveManual(
  vinOrLookup: string | VehicleLookup
): Promise<ManualRetrievalResult> {
  const vehicle = await resolveVehicle(vinOrLookup);
  const cacheKey = buildCacheKey(vehicle);
  const now = new Date().toISOString();

  // 1. Cache check
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return {
      source: 'cache',
      vehicle: cached.vehicle,
      manual_url: cached.manual_url,
      manual_title: `${cached.vehicle.year} ${cached.vehicle.make} ${cached.vehicle.model} Owner's Manual`,
      retrieved_at: now,
      cached: true,
    };
  }

  // 2. VehicleDatabases.com
  const vdbResult = await queryVehicleDatabases(vehicle);
  if (vdbResult?.manual_url) {
    await cacheResult(cacheKey, vehicle, vdbResult);
    return vdbResult;
  }

  // 3. OEM direct URL
  const oemResult = await tryOemFallback(vehicle);
  if (oemResult?.manual_url) {
    await cacheResult(cacheKey, vehicle, oemResult);
    return oemResult;
  }

  // 4. Web search fallback – provide a search link
  const searchUrl = buildWebSearchFallbackUrl(vehicle);
  return {
    source: 'web_search',
    vehicle,
    manual_url: searchUrl,
    manual_title: `Search for ${vehicle.year} ${vehicle.make} ${vehicle.model} Owner's Manual`,
    retrieved_at: now,
    cached: false,
  };
}

/**
 * Cache a successful manual lookup.
 */
async function cacheResult(
  cacheKey: string,
  vehicle: VehicleLookup,
  result: ManualRetrievalResult
): Promise<void> {
  if (!result.manual_url) return;
  await writeToCache({
    cache_key: cacheKey,
    vehicle,
    manual_url: result.manual_url,
    source: result.source,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  });
}

// ---------------------------------------------------------------------------
// 7. Check Supabase manuals table for already-processed manuals
// ---------------------------------------------------------------------------

/**
 * Check if we already have an indexed manual for this vehicle.
 * Returns the manual_id if found.
 */
export async function findIndexedManual(
  vehicle: VehicleLookup
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('manuals')
      .select('manual_id, processing_status')
      .eq('make', vehicle.make)
      .eq('model', vehicle.model)
      .eq('year', vehicle.year)
      .eq('processing_status', 'completed')
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.manual_id;
  } catch {
    return null;
  }
}

/**
 * Create a new manual record in Supabase for processing.
 */
export async function createManualRecord(
  vehicle: VehicleLookup,
  pdfUrl: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('manuals')
      .insert({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        trim: vehicle.trim || null,
        file_url: pdfUrl,
        language: 'en',
        processing_status: 'pending',
      })
      .select('manual_id')
      .single();

    if (error || !data) {
      console.warn('[ManualRetrieval] Failed to create manual record:', error);
      return null;
    }

    return data.manual_id;
  } catch (err) {
    console.warn('[ManualRetrieval] createManualRecord error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 8. Comprehensive vehicle report
// ---------------------------------------------------------------------------

export interface VehicleReport {
  vehicle: VehicleLookup;
  manual: ManualRetrievalResult;
  recalls: RecallResult;
  safety: SafetyRatingResult;
  indexed_manual_id: string | null;
}

/**
 * Produce a comprehensive vehicle report including manual URL,
 * active recalls, safety ratings, and indexed manual status.
 */
export async function getVehicleReport(
  vinOrLookup: string | VehicleLookup
): Promise<VehicleReport> {
  const vehicle = await resolveVehicle(vinOrLookup);

  // Run all queries in parallel
  const [manual, recalls, safety, indexedManualId] = await Promise.all([
    retrieveManual(vehicle),
    getRecalls(vehicle),
    getSafetyRatings(vehicle),
    findIndexedManual(vehicle),
  ]);

  return {
    vehicle,
    manual,
    recalls,
    safety,
    indexed_manual_id: indexedManualId,
  };
}
