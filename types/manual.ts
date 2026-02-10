/**
 * Gear AI CoPilot - Owner's Manual Type Definitions
 *
 * Data models for the manual retrieval pipeline, RAG processing,
 * and OEM owner's manual API integration.
 */

// ---------------------------------------------------------------------------
// Vehicle lookup helpers
// ---------------------------------------------------------------------------

export interface VehicleLookup {
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
}

// ---------------------------------------------------------------------------
// Manual retrieval (VehicleDatabases / fallback)
// ---------------------------------------------------------------------------

export interface ManualRetrievalResult {
  /** Where the manual URL was sourced from */
  source: 'vehicledatabases' | 'nhtsa_cache' | 'web_search' | 'oem_fallback' | 'cache';
  vehicle: VehicleLookup;
  manual_url: string | null;
  manual_title?: string;
  page_count?: number;
  file_size_bytes?: number;
  /** ISO timestamp */
  retrieved_at: string;
  cached: boolean;
  error?: string;
}

export interface VehicleDatabasesResponse {
  status: string;
  data: {
    year: number;
    make: string;
    model: string;
    owner_manual_url: string;
  };
}

// ---------------------------------------------------------------------------
// NHTSA Recalls
// ---------------------------------------------------------------------------

export interface NHTSARecall {
  NHTSACampaignNumber: string;
  ReportReceivedDate: string;
  Component: string;
  Summary: string;
  Consequence: string;
  Remedy: string;
  Manufacturer: string;
  ModelYear: string;
  Make: string;
  Model: string;
}

export interface RecallResult {
  recalls: NHTSARecall[];
  count: number;
  vehicle: VehicleLookup;
  retrieved_at: string;
}

// ---------------------------------------------------------------------------
// NHTSA Safety Ratings
// ---------------------------------------------------------------------------

export interface SafetyRating {
  OverallRating: string;
  OverallFrontCrashRating: string;
  OverallSideCrashRating: string;
  RolloverRating: string;
  VehicleDescription: string;
  VehicleId: number;
}

export interface SafetyRatingResult {
  ratings: SafetyRating[];
  vehicle: VehicleLookup;
  retrieved_at: string;
}

// ---------------------------------------------------------------------------
// RAG chunking and embeddings
// ---------------------------------------------------------------------------

export type ChunkLevel = 'chapter' | 'section' | 'procedure';

export interface ManualChunk {
  chunk_id: string;
  manual_id: string;
  chunk_index: number;
  parent_chunk_id?: string;
  chunk_level: ChunkLevel;
  text: string;
  page_number?: number;
  section_title?: string;
  token_count: number;
  metadata: ManualChunkMetadata;
}

export interface ManualChunkMetadata {
  vehicle_make: string;
  vehicle_model: string;
  model_year: number;
  section?: string;
  subsection?: string;
  page?: number;
  content_type?: 'specification' | 'procedure' | 'warning' | 'general';
  keywords?: string[];
}

// ---------------------------------------------------------------------------
// Two-stage retrieval
// ---------------------------------------------------------------------------

export interface ManualSearchQuery {
  query: string;
  vehicle?: VehicleLookup;
  manual_id?: string;
  limit?: number;
  /** Minimum similarity score (0-1) for vector search */
  similarity_threshold?: number;
  /** Include BM25 keyword matching as stage 1 */
  use_bm25?: boolean;
}

export interface ManualSearchResult {
  chunk_id: string;
  manual_id: string;
  chunk_text: string;
  page_number?: number;
  section_title?: string;
  /** Cosine similarity or combined score */
  score: number;
  /** How the result was found */
  retrieval_method: 'bm25' | 'semantic' | 'hybrid';
  vehicle: VehicleLookup;
}

export interface ManualSearchResponse {
  results: ManualSearchResult[];
  query: string;
  total_results: number;
  retrieval_time_ms: number;
  vehicle?: VehicleLookup;
}

// ---------------------------------------------------------------------------
// PDF processing pipeline status
// ---------------------------------------------------------------------------

export type ProcessingStatus = 'pending' | 'downloading' | 'parsing' | 'chunking' | 'embedding' | 'completed' | 'failed';

export interface ManualProcessingJob {
  job_id: string;
  manual_id: string;
  vehicle: VehicleLookup;
  pdf_url: string;
  status: ProcessingStatus;
  progress: number; // 0-100
  chunks_created: number;
  embeddings_created: number;
  error?: string;
  started_at: string;
  completed_at?: string;
}

// ---------------------------------------------------------------------------
// API cache
// ---------------------------------------------------------------------------

export interface CachedManualLookup {
  cache_key: string;
  vehicle: VehicleLookup;
  manual_url: string;
  source: ManualRetrievalResult['source'];
  created_at: string;
  expires_at: string;
}
