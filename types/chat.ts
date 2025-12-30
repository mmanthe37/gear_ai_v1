/**
 * Gear AI CoPilot - Chat & AI Type Definitions
 * 
 * Data models for AI chat sessions and messages
 */

export interface ChatSession {
  session_id: string;
  user_id: string;
  vehicle_id?: string;
  title?: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  is_active: boolean;
  context_type: 'general' | 'manual' | 'diagnostic' | 'maintenance' | 'valuation';
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  message_id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  model_version?: string;
  retrieval_context?: RetrievalContext;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface RetrievalContext {
  sources: RAGSource[];
  query_embedding?: number[];
  search_results_count: number;
  reranked: boolean;
}

export interface RAGSource {
  embedding_id: string;
  manual_id: string;
  chunk_text: string;
  page_number?: number;
  section_title?: string;
  similarity_score: number;
  manual_name?: string; // e.g., "2023 Honda Accord Owner's Manual"
}

export interface AIRequest {
  session_id: string;
  message: string;
  vehicle_id?: string;
  context_type?: ChatSession['context_type'];
  include_rag?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface AIResponse {
  message_id: string;
  content: string;
  sources?: RAGSource[];
  tokens_used: number;
  model_version: string;
  created_at: string;
}

export interface Manual {
  manual_id: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  file_url?: string;
  file_size_bytes?: number;
  page_count?: number;
  language: string;
  version?: string;
  upload_date: string;
  processed: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface VectorEmbedding {
  embedding_id: string;
  manual_id: string;
  chunk_text: string;
  chunk_index: number;
  parent_chunk_id?: string;
  page_number?: number;
  section_title?: string;
  embedding: number[]; // 768-dimensional vector
  token_count?: number;
  chunk_type: 'parent' | 'child';
  created_at: string;
  metadata?: Record<string, any>;
}

export interface SearchQuery {
  query: string;
  manual_id?: string; // Optional: limit search to specific manual
  vehicle_id?: string; // Optional: limit search to vehicle's manual
  limit?: number; // Number of results to return
  threshold?: number; // Minimum similarity score (0-1)
}

export interface SearchResult {
  embedding_id: string;
  chunk_text: string;
  page_number?: number;
  section_title?: string;
  similarity: number;
  manual: {
    manual_id: string;
    make: string;
    model: string;
    year: number;
  };
}

// AI model configurations
export const AIModels = {
  GPT4_TURBO: {
    name: 'gpt-4-turbo-preview',
    max_tokens: 4096,
    cost_per_1k_input: 0.01,
    cost_per_1k_output: 0.03,
  },
  GPT35_TURBO: {
    name: 'gpt-3.5-turbo',
    max_tokens: 4096,
    cost_per_1k_input: 0.0015,
    cost_per_1k_output: 0.002,
  },
  EMBEDDING_SMALL: {
    name: 'text-embedding-3-small',
    dimensions: 1536,
    cost_per_1k: 0.00002,
  },
} as const;

export type AIModelType = keyof typeof AIModels;
