-- Gear AI CoPilot - Vector Search RPC Function
-- Version: 20250201000000
-- Description: Create search_manual_chunks function for two-stage RAG retrieval

-- ============================================================================
-- SEARCH FUNCTION (pgvector cosine similarity)
-- ============================================================================

CREATE OR REPLACE FUNCTION search_manual_chunks(
  query_embedding text,
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 8,
  filter_manual_id uuid DEFAULT NULL
)
RETURNS TABLE (
  embedding_id uuid,
  manual_id uuid,
  chunk_text text,
  page_number int,
  section_title varchar,
  similarity float,
  make varchar,
  model varchar,
  year int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ve.embedding_id,
    ve.manual_id,
    ve.chunk_text,
    ve.page_number,
    ve.section_title,
    (1 - (ve.embedding <=> query_embedding::vector))::float AS similarity,
    m.make,
    m.model,
    m.year
  FROM public.vector_embeddings ve
  JOIN public.manuals m ON m.manual_id = ve.manual_id
  WHERE
    (filter_manual_id IS NULL OR ve.manual_id = filter_manual_id)
    AND ve.embedding IS NOT NULL
    AND (1 - (ve.embedding <=> query_embedding::vector)) > match_threshold
  ORDER BY ve.embedding <=> query_embedding::vector ASC
  LIMIT match_count;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION search_manual_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_manual_chunks TO anon;

-- ============================================================================
-- FULL-TEXT SEARCH INDEX for BM25-style keyword matching
-- ============================================================================

-- Add a tsvector column for full-text search
ALTER TABLE public.vector_embeddings
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate the search vector
UPDATE public.vector_embeddings
  SET search_vector = to_tsvector('english', COALESCE(chunk_text, '') || ' ' || COALESCE(section_title, ''));

-- Create GIN index for fast text search
CREATE INDEX IF NOT EXISTS idx_embeddings_search_vector
  ON public.vector_embeddings USING GIN(search_vector);

-- Trigger to auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.chunk_text, '') || ' ' || COALESCE(NEW.section_title, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_search_vector
  BEFORE INSERT OR UPDATE ON public.vector_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION search_manual_chunks IS 'Two-stage RAG retrieval: semantic vector search with cosine similarity for owner manual content';
