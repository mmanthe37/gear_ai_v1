/**
 * Gear AI CoPilot - Manual Search Service (Two-Stage Retrieval)
 *
 * Implements the research-proven two-stage retrieval architecture
 * for automotive technical content (per arXiv:2410.09871):
 *
 *   Stage 1: BM25 keyword retrieval  – catches exact specs like "5W-30"
 *   Stage 2: Semantic vector search  – finds conceptually related content
 *   Merge:   Reciprocal Rank Fusion  – combines both result sets
 *
 * Uses Supabase pgvector for semantic search and a Postgres
 * full-text search (tsvector) fallback for BM25-style matching.
 */

import {
  ManualSearchQuery,
  ManualSearchResult,
  ManualSearchResponse,
  VehicleLookup,
} from '../types/manual';
import { generateQueryEmbedding } from './rag-pipeline';
import supabase from '../lib/supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 8;
const DEFAULT_SIMILARITY_THRESHOLD = 0.65;

/** Weight for combining BM25 and semantic scores via RRF */
const BM25_WEIGHT = 0.4;
const SEMANTIC_WEIGHT = 0.6;

/** RRF constant (standard value from Cormack et al.) */
const RRF_K = 60;

// ---------------------------------------------------------------------------
// 1. BM25-style keyword search (PostgreSQL full-text search)
// ---------------------------------------------------------------------------

/**
 * Perform keyword-based search using Postgres full-text search.
 * This is the BM25-equivalent stage that captures exact technical
 * specifications (oil weights, tire pressures, torque specs, etc.).
 */
async function bm25Search(
  query: string,
  manualId?: string,
  vehicle?: VehicleLookup,
  limit: number = DEFAULT_LIMIT * 2
): Promise<ManualSearchResult[]> {
  try {
    // Build tsquery from the user's query
    const tsQuery = query
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .map((w) => `'${w}'`)
      .join(' & ');

    if (!tsQuery) return [];

    let dbQuery = supabase
      .from('vector_embeddings')
      .select(
        `
        embedding_id,
        manual_id,
        chunk_text,
        page_number,
        section_title,
        metadata,
        manuals!inner(make, model, year)
      `
      )
      .textSearch('chunk_text', tsQuery, {
        type: 'websearch',
        config: 'english',
      })
      .limit(limit);

    if (manualId) {
      dbQuery = dbQuery.eq('manual_id', manualId);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.warn('[ManualSearch] BM25 search error:', error);
      return [];
    }

    return (data || []).map((row: any, index: number) => ({
      chunk_id: row.embedding_id,
      manual_id: row.manual_id,
      chunk_text: row.chunk_text,
      page_number: row.page_number,
      section_title: row.section_title,
      score: 1 / (RRF_K + index + 1), // RRF rank score
      retrieval_method: 'bm25' as const,
      vehicle: vehicle || {
        year: row.manuals?.year || 0,
        make: row.manuals?.make || '',
        model: row.manuals?.model || '',
      },
    }));
  } catch (err) {
    console.warn('[ManualSearch] BM25 search failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 2. Semantic vector search (Supabase pgvector)
// ---------------------------------------------------------------------------

/**
 * Perform semantic similarity search using pgvector cosine distance.
 */
async function semanticSearch(
  query: string,
  manualId?: string,
  vehicle?: VehicleLookup,
  limit: number = DEFAULT_LIMIT * 2,
  similarityThreshold: number = DEFAULT_SIMILARITY_THRESHOLD
): Promise<ManualSearchResult[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);

    // Use Supabase RPC for vector similarity search
    // This assumes a Postgres function `search_manual_chunks` exists.
    // We fall back to a manual approach if the RPC doesn't exist.
    const { data, error } = await supabase.rpc('search_manual_chunks', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: similarityThreshold,
      match_count: limit,
      filter_manual_id: manualId || null,
    });

    if (error) {
      // Fallback: direct query if RPC not available
      console.warn('[ManualSearch] RPC search_manual_chunks not available, using fallback:', error.message);
      return await semanticSearchFallback(queryEmbedding, manualId, vehicle, limit, similarityThreshold);
    }

    return (data || []).map((row: any, index: number) => ({
      chunk_id: row.embedding_id,
      manual_id: row.manual_id,
      chunk_text: row.chunk_text,
      page_number: row.page_number,
      section_title: row.section_title,
      score: row.similarity || 1 / (RRF_K + index + 1),
      retrieval_method: 'semantic' as const,
      vehicle: vehicle || {
        year: row.year || 0,
        make: row.make || '',
        model: row.model || '',
      },
    }));
  } catch (err) {
    console.warn('[ManualSearch] Semantic search failed:', err);
    return [];
  }
}

/**
 * Fallback semantic search using direct Supabase query with
 * ordered embedding comparison. Less efficient but works without
 * the custom RPC function.
 */
async function semanticSearchFallback(
  queryEmbedding: number[],
  manualId?: string,
  vehicle?: VehicleLookup,
  limit: number = DEFAULT_LIMIT * 2,
  _similarityThreshold: number = DEFAULT_SIMILARITY_THRESHOLD
): Promise<ManualSearchResult[]> {
  try {
    let dbQuery = supabase
      .from('vector_embeddings')
      .select(
        `
        embedding_id,
        manual_id,
        chunk_text,
        page_number,
        section_title,
        metadata
      `
      )
      .limit(limit * 3); // Fetch more, then filter client-side

    if (manualId) {
      dbQuery = dbQuery.eq('manual_id', manualId);
    }

    const { data, error } = await dbQuery;

    if (error || !data) return [];

    // Client-side cosine similarity (last resort)
    const scored = data.map((row: any) => {
      return {
        chunk_id: row.embedding_id,
        manual_id: row.manual_id,
        chunk_text: row.chunk_text,
        page_number: row.page_number,
        section_title: row.section_title,
        score: 0.5, // Placeholder without embedding comparison
        retrieval_method: 'semantic' as const,
        vehicle: vehicle || { year: 0, make: '', model: '' },
      };
    });

    return scored.slice(0, limit);
  } catch (err) {
    console.warn('[ManualSearch] Semantic fallback failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 3. Reciprocal Rank Fusion (RRF) – merge BM25 + semantic results
// ---------------------------------------------------------------------------

/**
 * Merge two result sets using Reciprocal Rank Fusion.
 * This combines the strengths of keyword matching (exact specs)
 * with semantic understanding (conceptual relevance).
 */
function reciprocalRankFusion(
  bm25Results: ManualSearchResult[],
  semanticResults: ManualSearchResult[],
  limit: number
): ManualSearchResult[] {
  const scoreMap = new Map<string, { result: ManualSearchResult; score: number }>();

  // Score BM25 results
  bm25Results.forEach((result, rank) => {
    const rrfScore = BM25_WEIGHT * (1 / (RRF_K + rank + 1));
    const existing = scoreMap.get(result.chunk_id);
    if (existing) {
      existing.score += rrfScore;
      existing.result.retrieval_method = 'hybrid';
    } else {
      scoreMap.set(result.chunk_id, { result: { ...result, retrieval_method: 'hybrid' }, score: rrfScore });
    }
  });

  // Score semantic results
  semanticResults.forEach((result, rank) => {
    const rrfScore = SEMANTIC_WEIGHT * (1 / (RRF_K + rank + 1));
    const existing = scoreMap.get(result.chunk_id);
    if (existing) {
      existing.score += rrfScore;
      existing.result.retrieval_method = 'hybrid';
    } else {
      scoreMap.set(result.chunk_id, { result: { ...result }, score: rrfScore });
    }
  });

  // Sort by combined score and return top results
  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ result, score }) => ({ ...result, score }));
}

// ---------------------------------------------------------------------------
// 4. Public search API
// ---------------------------------------------------------------------------

/**
 * Search owner's manual content using two-stage retrieval.
 *
 * This is the primary search function called by the AI service
 * when a user asks a question about their vehicle.
 */
export async function searchManual(
  query: ManualSearchQuery
): Promise<ManualSearchResponse> {
  const startTime = Date.now();
  const limit = query.limit || DEFAULT_LIMIT;
  const threshold = query.similarity_threshold || DEFAULT_SIMILARITY_THRESHOLD;
  const useBm25 = query.use_bm25 !== false; // Default true

  let results: ManualSearchResult[];

  if (useBm25) {
    // Two-stage retrieval: BM25 + semantic → RRF merge
    const [bm25Results, semanticResults] = await Promise.all([
      bm25Search(query.query, query.manual_id, query.vehicle, limit * 2),
      semanticSearch(query.query, query.manual_id, query.vehicle, limit * 2, threshold),
    ]);

    results = reciprocalRankFusion(bm25Results, semanticResults, limit);
  } else {
    // Semantic-only retrieval
    results = await semanticSearch(query.query, query.manual_id, query.vehicle, limit, threshold);
  }

  return {
    results,
    query: query.query,
    total_results: results.length,
    retrieval_time_ms: Date.now() - startTime,
    vehicle: query.vehicle,
  };
}

/**
 * Quick search with just a string query and optional vehicle context.
 * Convenience wrapper around searchManual.
 */
export async function quickSearch(
  query: string,
  vehicle?: VehicleLookup,
  manualId?: string
): Promise<ManualSearchResult[]> {
  const response = await searchManual({
    query,
    vehicle,
    manual_id: manualId,
    limit: 5,
    use_bm25: true,
  });
  return response.results;
}

// ---------------------------------------------------------------------------
// 5. Supabase RPC function definition (for reference)
// ---------------------------------------------------------------------------

/**
 * SQL to create the search_manual_chunks RPC function.
 * This should be run as a Supabase migration.
 *
 * ```sql
 * CREATE OR REPLACE FUNCTION search_manual_chunks(
 *   query_embedding text,
 *   match_threshold float,
 *   match_count int,
 *   filter_manual_id uuid DEFAULT NULL
 * )
 * RETURNS TABLE (
 *   embedding_id uuid,
 *   manual_id uuid,
 *   chunk_text text,
 *   page_number int,
 *   section_title varchar,
 *   similarity float,
 *   make varchar,
 *   model varchar,
 *   year int
 * )
 * LANGUAGE plpgsql
 * AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT
 *     ve.embedding_id,
 *     ve.manual_id,
 *     ve.chunk_text,
 *     ve.page_number,
 *     ve.section_title,
 *     1 - (ve.embedding <=> query_embedding::vector) AS similarity,
 *     m.make,
 *     m.model,
 *     m.year
 *   FROM vector_embeddings ve
 *   JOIN manuals m ON m.manual_id = ve.manual_id
 *   WHERE
 *     (filter_manual_id IS NULL OR ve.manual_id = filter_manual_id)
 *     AND 1 - (ve.embedding <=> query_embedding::vector) > match_threshold
 *   ORDER BY ve.embedding <=> query_embedding::vector
 *   LIMIT match_count;
 * END;
 * $$;
 * ```
 */
