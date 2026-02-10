/**
 * Gear AI CoPilot - AI Service
 *
 * Integrates with OpenAI for conversational AI, RAG-powered
 * owner's manual queries, and vehicle-context-aware responses.
 *
 * Uses the two-stage retrieval pipeline (BM25 + semantic) to ground
 * responses in actual owner's manual content, recalls, and specs.
 */

import {
  AIRequest,
  AIResponse,
  SearchQuery,
  SearchResult,
  RAGSource,
} from '../types';
import {
  VehicleLookup,
  ManualSearchResult,
} from '../types/manual';
import { searchManual, quickSearch } from './manual-search';
import {
  retrieveManual,
  getRecalls,
  findIndexedManual,
} from './manual-retrieval';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4-turbo-preview';
const FALLBACK_MODEL = 'gpt-3.5-turbo';

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const BASE_SYSTEM_PROMPT = `You are Gear AI, an expert automotive assistant specializing in owner's manual queries, vehicle maintenance, diagnostics, and safety information.

Guidelines:
- Be precise and cite page numbers when referencing owner's manual content.
- When providing maintenance specifications (oil type, tire pressure, fluid capacities), always give the exact values from the manual.
- If you are unsure or don't have the specific information, say so clearly and recommend consulting the physical owner's manual or an authorized dealer.
- Flag any safety warnings prominently.
- Use plain language accessible to non-mechanics while being technically accurate.`;

function buildVehicleContext(vehicle: VehicleLookup): string {
  let ctx = `\nVehicle Context: ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  if (vehicle.trim) ctx += ` ${vehicle.trim}`;
  if (vehicle.vin) ctx += ` (VIN: ${vehicle.vin})`;
  return ctx;
}

function buildRAGContext(sources: RAGSource[]): string {
  if (sources.length === 0) return '';

  let ctx = '\n\nRelevant Owner\'s Manual Excerpts:\n';
  sources.forEach((source, i) => {
    ctx += `\n[Source ${i + 1}]`;
    if (source.manual_name) ctx += ` ${source.manual_name}`;
    if (source.page_number) ctx += `, Page ${source.page_number}`;
    if (source.section_title) ctx += ` - ${source.section_title}`;
    ctx += `:\n${source.chunk_text}\n`;
  });
  ctx += '\nAlways cite the specific source number and page when using information from the manual excerpts above.';
  return ctx;
}

function buildRecallContext(
  recalls: Array<{ Component: string; Summary: string; Remedy: string }>
): string {
  if (recalls.length === 0) return '';

  let ctx = '\n\nActive NHTSA Recalls for this vehicle:\n';
  recalls.forEach((r, i) => {
    ctx += `\n[Recall ${i + 1}] Component: ${r.Component}\nSummary: ${r.Summary}\nRemedy: ${r.Remedy}\n`;
  });
  ctx += '\nMention any relevant recalls when they relate to the user\'s question.';
  return ctx;
}

// ---------------------------------------------------------------------------
// Core AI response generation
// ---------------------------------------------------------------------------

/**
 * Generate an AI response with full RAG pipeline integration.
 *
 * Flow:
 *   1. If vehicle context provided, search indexed manuals for relevant chunks
 *   2. Optionally fetch recall data for safety-related queries
 *   3. Build system prompt with manual excerpts and vehicle context
 *   4. Call OpenAI GPT-4 Turbo for the response
 *   5. Return response with source citations
 */
export async function generateAIResponse(
  request: AIRequest
): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  // If no API key, fall back to intelligent template response
  if (!apiKey) {
    return generateTemplateResponse(request);
  }

  let ragSources: RAGSource[] = [];
  let recallContext = '';
  let vehicleContext = '';

  // Build vehicle lookup from request metadata
  const vehicle = extractVehicleFromRequest(request);

  if (vehicle) {
    vehicleContext = buildVehicleContext(vehicle);

    // RAG search: find relevant manual chunks
    if (request.include_rag !== false) {
      try {
        const manualId = await findIndexedManual(vehicle);
        const searchResults = await quickSearch(
          request.message,
          vehicle,
          manualId || undefined
        );

        ragSources = searchResults.map((r: ManualSearchResult) => ({
          embedding_id: r.chunk_id,
          manual_id: r.manual_id,
          chunk_text: r.chunk_text,
          page_number: r.page_number,
          section_title: r.section_title,
          similarity_score: r.score,
          manual_name: `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model} Owner's Manual`,
        }));
      } catch (err) {
        console.warn('[AI Service] RAG search failed, proceeding without manual context:', err);
      }
    }

    // Check for recalls if the question seems safety-related
    if (isSafetyRelated(request.message)) {
      try {
        const recallResult = await getRecalls(vehicle);
        if (recallResult.recalls.length > 0) {
          recallContext = buildRecallContext(
            recallResult.recalls.slice(0, 3)
          );
        }
      } catch (err) {
        console.warn('[AI Service] Recall fetch failed:', err);
      }
    }
  }

  // Build the full system prompt
  const systemPrompt =
    BASE_SYSTEM_PROMPT +
    vehicleContext +
    buildRAGContext(ragSources) +
    recallContext;

  try {
    const model = request.context_type === 'general' ? FALLBACK_MODEL : DEFAULT_MODEL;

    const res = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.message },
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1000,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.warn('[AI Service] OpenAI API error:', res.status, errBody);
      return generateTemplateResponse(request);
    }

    const json = await res.json();
    const choice = json.choices?.[0];

    return {
      message_id: generateUUID(),
      content: choice?.message?.content || 'I was unable to generate a response. Please try again.',
      sources: ragSources.length > 0 ? ragSources : undefined,
      tokens_used: json.usage?.total_tokens || 0,
      model_version: json.model || model,
      created_at: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[AI Service] OpenAI request failed:', err);
    return generateTemplateResponse(request);
  }
}

// ---------------------------------------------------------------------------
// Template-based fallback (no API key)
// ---------------------------------------------------------------------------

function generateTemplateResponse(request: AIRequest): AIResponse {
  const content = getSmartTemplateResponse(request.message);
  return {
    message_id: generateUUID(),
    content,
    tokens_used: 0,
    model_version: 'template-v1',
    created_at: new Date().toISOString(),
  };
}

function getSmartTemplateResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes('oil') && (lower.includes('type') || lower.includes('change') || lower.includes('weight'))) {
    return 'To find the correct oil type and capacity for your vehicle, I recommend checking your owner\'s manual in the "Maintenance" or "Specifications" section. Common specifications include 0W-20, 5W-20, or 5W-30 synthetic oil. Once I have access to your indexed manual, I can provide the exact specification.';
  }

  if (lower.includes('tire') && (lower.includes('pressure') || lower.includes('psi') || lower.includes('size'))) {
    return 'Tire pressure specifications are typically found on a sticker inside the driver\'s door jamb and in the "Tires" section of your owner\'s manual. I\'ll be able to provide exact PSI values once your vehicle\'s manual is indexed in the system.';
  }

  if (lower.includes('recall') || lower.includes('safety')) {
    return 'I can check NHTSA recall data for your vehicle. Recall information is retrieved in real-time from the National Highway Traffic Safety Administration database. Please ensure your vehicle\'s year, make, and model are set correctly.';
  }

  if (lower.includes('maintenance') || lower.includes('schedule') || lower.includes('service')) {
    return 'Maintenance schedules vary by vehicle and driving conditions. Your owner\'s manual contains detailed service intervals. Common schedules include oil changes every 5,000-7,500 miles, tire rotation every 5,000 miles, and brake inspection every 12,000-15,000 miles. I\'ll be able to give you exact intervals once your manual is indexed.';
  }

  if (lower.includes('warning') || lower.includes('light') || lower.includes('dashboard')) {
    return 'Dashboard warning lights are explained in the "Instrument Cluster" or "Warning Indicators" section of your owner\'s manual. Common warnings include check engine (amber), oil pressure (red), battery (red), and TPMS (amber). If you see a red warning light, pull over safely and address it immediately.';
  }

  if (lower.includes('manual') || lower.includes('download') || lower.includes('pdf')) {
    return 'I can retrieve your owner\'s manual PDF through the VehicleDatabases API or directly from your manufacturer\'s website. Navigate to the "Manuals" tab and enter your VIN or vehicle details to begin the retrieval process.';
  }

  return 'I\'m your Gear AI assistant, ready to help with vehicle maintenance, owner\'s manual queries, diagnostics, and safety information. Ask me about oil specifications, tire pressure, maintenance schedules, dashboard warnings, or any other vehicle-related question. For the best experience, make sure your vehicle is set up so I can reference your specific owner\'s manual.';
}

// ---------------------------------------------------------------------------
// Manual search (public wrapper for existing code)
// ---------------------------------------------------------------------------

export async function searchManualChunks(
  query: SearchQuery
): Promise<SearchResult[]> {
  try {
    const response = await searchManual({
      query: query.query,
      manual_id: query.manual_id,
      limit: query.limit || 5,
      similarity_threshold: query.threshold || 0.7,
    });

    return response.results.map((r) => ({
      embedding_id: r.chunk_id,
      chunk_text: r.chunk_text,
      page_number: r.page_number,
      section_title: r.section_title,
      similarity: r.score,
      manual: {
        manual_id: r.manual_id,
        make: r.vehicle.make,
        model: r.vehicle.model,
        year: r.vehicle.year,
      },
    }));
  } catch (err) {
    console.warn('[AI Service] searchManualChunks failed:', err);
    return [];
  }
}

/**
 * Generate embedding for text (public API).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { generateQueryEmbedding } = await import('./rag-pipeline');
  return generateQueryEmbedding(text);
}

/**
 * Process a manual PDF (public API).
 */
export async function processManualPDF(
  manualId: string,
  fileUrl: string
): Promise<void> {
  const { processManual } = await import('./rag-pipeline');
  // We need vehicle info to process - retrieve from the manuals table
  const { data } = await (await import('../lib/supabase')).default
    .from('manuals')
    .select('make, model, year, trim')
    .eq('manual_id', manualId)
    .single();

  if (!data) {
    throw new Error(`Manual ${manualId} not found`);
  }

  await processManual(manualId, fileUrl, {
    year: data.year,
    make: data.make,
    model: data.model,
    trim: data.trim,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractVehicleFromRequest(request: AIRequest): VehicleLookup | null {
  // Check metadata for vehicle info
  const meta = request as any;
  if (meta.vehicle_year && meta.vehicle_make && meta.vehicle_model) {
    return {
      year: meta.vehicle_year,
      make: meta.vehicle_make,
      model: meta.vehicle_model,
      trim: meta.vehicle_trim,
      vin: meta.vehicle_vin,
    };
  }
  return null;
}

function isSafetyRelated(message: string): boolean {
  const safetyKeywords = [
    'recall', 'safety', 'airbag', 'brake', 'braking', 'accident',
    'crash', 'fire', 'smoke', 'warning', 'defect', 'hazard',
    'steer', 'steering', 'rollover',
  ];
  const lower = message.toLowerCase();
  return safetyKeywords.some((kw) => lower.includes(kw));
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
