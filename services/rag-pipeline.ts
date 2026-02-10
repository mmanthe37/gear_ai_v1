/**
 * Gear AI CoPilot - RAG Pipeline Service
 *
 * Handles the full PDF → Chunks → Embeddings → Vector Store pipeline.
 *
 * Architecture:
 *   1. PDF text extraction (via fetch + basic text extraction for web runtime)
 *   2. Hierarchical chunking (chapter / section / procedure)
 *   3. Embedding generation (OpenAI text-embedding-3-small)
 *   4. Supabase pgvector storage
 *
 * The chunking strategy is specifically optimized for automotive owner's manuals
 * as recommended by arXiv:2410.09871.
 */

import {
  ManualChunk,
  ManualChunkMetadata,
  ChunkLevel,
  ManualProcessingJob,
  ProcessingStatus,
  VehicleLookup,
} from '../types/manual';
import supabase from '../lib/supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Max tokens per chunk level */
const CHUNK_LIMITS: Record<ChunkLevel, number> = {
  chapter: 2048,
  section: 512,
  procedure: 256,
};

/** Overlap between chunks in tokens (approx 4 chars/token) */
const CHUNK_OVERLAP_TOKENS = 40;

/** Approximate chars per token for English text */
const CHARS_PER_TOKEN = 4;

/** OpenAI embedding model */
const EMBEDDING_MODEL = 'text-embedding-3-small';

/** Embedding dimensions */
const EMBEDDING_DIMENSIONS = 768;

// ---------------------------------------------------------------------------
// 1. Text extraction helpers
// ---------------------------------------------------------------------------

/**
 * Section heading patterns commonly found in owner's manuals.
 */
const CHAPTER_PATTERN = /^(?:chapter\s+\d+|part\s+\d+|section\s+[ivxlcdm\d]+)\s*[:\-–—]?\s*/im;
const SECTION_PATTERN = /^(?:#{1,3}\s+|\d+\.\d+\s+|[A-Z][A-Z\s]{3,}$)/m;
const PAGE_PATTERN = /(?:^|\n)\s*(?:page\s+)?(\d{1,4})\s*(?:$|\n)/im;

/**
 * Estimate token count for a text string.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Generate a UUID (v4 compatible).
 */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// 2. Hierarchical chunking engine
// ---------------------------------------------------------------------------

/**
 * Split raw manual text into hierarchical chunks.
 *
 * Strategy (per blueprint):
 *   - Chapter level:   ~2048 tokens
 *   - Section level:   ~512 tokens
 *   - Procedure level: ~128-256 tokens
 *   - Overlap:         20-50 tokens at boundaries
 */
export function chunkManualText(
  rawText: string,
  manualId: string,
  vehicle: VehicleLookup
): ManualChunk[] {
  const chunks: ManualChunk[] = [];
  let chunkIndex = 0;

  // Step 1: Split into chapter-level blocks
  const chapterBlocks = splitByPattern(rawText, CHAPTER_PATTERN, CHUNK_LIMITS.chapter);

  for (const chapterBlock of chapterBlocks) {
    const chapterTitle = extractTitle(chapterBlock);
    const chapterId = uuid();

    // Create chapter-level chunk
    const chapterChunk: ManualChunk = {
      chunk_id: chapterId,
      manual_id: manualId,
      chunk_index: chunkIndex++,
      chunk_level: 'chapter',
      text: chapterBlock.slice(0, CHUNK_LIMITS.chapter * CHARS_PER_TOKEN),
      page_number: extractPageNumber(chapterBlock),
      section_title: chapterTitle,
      token_count: estimateTokens(chapterBlock),
      metadata: buildMetadata(vehicle, chapterTitle, 'general'),
    };
    chunks.push(chapterChunk);

    // Step 2: Split chapter into section-level blocks
    const sectionBlocks = splitByPattern(chapterBlock, SECTION_PATTERN, CHUNK_LIMITS.section);

    for (const sectionBlock of sectionBlocks) {
      const sectionTitle = extractTitle(sectionBlock) || chapterTitle;
      const sectionId = uuid();

      const sectionChunk: ManualChunk = {
        chunk_id: sectionId,
        manual_id: manualId,
        chunk_index: chunkIndex++,
        parent_chunk_id: chapterId,
        chunk_level: 'section',
        text: sectionBlock.slice(0, CHUNK_LIMITS.section * CHARS_PER_TOKEN),
        page_number: extractPageNumber(sectionBlock),
        section_title: sectionTitle,
        token_count: estimateTokens(sectionBlock),
        metadata: buildMetadata(vehicle, sectionTitle, detectContentType(sectionBlock)),
      };
      chunks.push(sectionChunk);

      // Step 3: Split into procedure-level blocks if section is large
      if (estimateTokens(sectionBlock) > CHUNK_LIMITS.section) {
        const procedureBlocks = splitIntoFixedChunks(
          sectionBlock,
          CHUNK_LIMITS.procedure,
          CHUNK_OVERLAP_TOKENS
        );

        for (const procBlock of procedureBlocks) {
          chunks.push({
            chunk_id: uuid(),
            manual_id: manualId,
            chunk_index: chunkIndex++,
            parent_chunk_id: sectionId,
            chunk_level: 'procedure',
            text: procBlock,
            page_number: extractPageNumber(procBlock),
            section_title: sectionTitle,
            token_count: estimateTokens(procBlock),
            metadata: buildMetadata(vehicle, sectionTitle, detectContentType(procBlock)),
          });
        }
      }
    }
  }

  return chunks;
}

/**
 * Split text by a regex pattern, respecting a max token limit per block.
 */
function splitByPattern(text: string, pattern: RegExp, maxTokens: number): string[] {
  const parts = text.split(pattern).filter((p) => p.trim().length > 0);

  // If no splits found or only one part, fall back to fixed-size chunking
  if (parts.length <= 1) {
    return splitIntoFixedChunks(text, maxTokens, CHUNK_OVERLAP_TOKENS);
  }

  return parts;
}

/**
 * Split text into fixed-size chunks with overlap.
 */
function splitIntoFixedChunks(
  text: string,
  maxTokens: number,
  overlapTokens: number
): string[] {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;
  const chunks: string[] = [];

  let start = 0;
  while (start < text.length) {
    let end = start + maxChars;

    // Try to break at a sentence boundary
    if (end < text.length) {
      const nearEnd = text.lastIndexOf('. ', end);
      if (nearEnd > start + maxChars * 0.5) {
        end = nearEnd + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlapChars;

    // Prevent infinite loop on very small text
    if (start >= text.length - 10) break;
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Extract a heading/title from the start of a text block.
 */
function extractTitle(text: string): string {
  const firstLine = text.trim().split('\n')[0]?.trim() || '';
  // Clean up common prefixes
  return firstLine
    .replace(/^#{1,4}\s*/, '')
    .replace(/^chapter\s+\d+\s*[:\-–—]?\s*/i, '')
    .replace(/^section\s+\d+\s*[:\-–—]?\s*/i, '')
    .slice(0, 120);
}

/**
 * Try to extract a page number from text.
 */
function extractPageNumber(text: string): number | undefined {
  const match = text.match(PAGE_PATTERN);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num > 0 && num < 2000) return num;
  }
  return undefined;
}

/**
 * Detect the type of content in a text block.
 */
function detectContentType(
  text: string
): 'specification' | 'procedure' | 'warning' | 'general' {
  const lower = text.toLowerCase();
  if (/\b(?:warning|caution|danger)\b/.test(lower)) return 'warning';
  if (/\b(?:step\s+\d|procedure|how\s+to|instructions?)\b/.test(lower)) return 'procedure';
  if (/\b(?:capacity|specification|torque|psi|quarts?|liters?|lbs?|dimensions?)\b/.test(lower))
    return 'specification';
  return 'general';
}

/**
 * Extract keywords from specification-type content.
 */
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  // Oil specs
  const oilMatch = text.match(/\b(\d+[Ww]-\d+)\b/g);
  if (oilMatch) keywords.push(...oilMatch);
  // Fluid capacities
  const capacityMatch = text.match(/\b(\d+\.?\d*)\s*(?:quarts?|liters?|gallons?|oz)\b/gi);
  if (capacityMatch) keywords.push(...capacityMatch);
  // Tire pressures
  const psiMatch = text.match(/\b(\d+)\s*psi\b/gi);
  if (psiMatch) keywords.push(...psiMatch);
  // Torque specs
  const torqueMatch = text.match(/\b(\d+)\s*(?:ft-lbs?|nm|lb-ft)\b/gi);
  if (torqueMatch) keywords.push(...torqueMatch);

  return [...new Set(keywords)].slice(0, 10);
}

/**
 * Build metadata for a chunk.
 */
function buildMetadata(
  vehicle: VehicleLookup,
  sectionTitle: string,
  contentType: ManualChunkMetadata['content_type']
): ManualChunkMetadata {
  return {
    vehicle_make: vehicle.make,
    vehicle_model: vehicle.model,
    model_year: vehicle.year,
    section: sectionTitle,
    content_type: contentType,
  };
}

// ---------------------------------------------------------------------------
// 3. Embedding generation
// ---------------------------------------------------------------------------

/**
 * Generate embeddings for an array of text chunks using OpenAI.
 *
 * Uses text-embedding-3-small with 768 dimensions to match
 * the pgvector column size in the DB schema.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Process in batches of 100 (OpenAI limit is 2048)
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI embedding API error ${res.status}: ${errBody}`);
    }

    const json = await res.json();
    const embeddings = json.data
      .sort((a: any, b: any) => a.index - b.index)
      .map((d: any) => d.embedding);

    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

/**
 * Generate a single query embedding.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([query]);
  return embedding;
}

// ---------------------------------------------------------------------------
// 4. Store chunks + embeddings in Supabase pgvector
// ---------------------------------------------------------------------------

/**
 * Store processed chunks and their embeddings into Supabase.
 */
export async function storeChunksWithEmbeddings(
  chunks: ManualChunk[],
  embeddings: number[][]
): Promise<number> {
  if (chunks.length !== embeddings.length) {
    throw new Error('Chunks and embeddings arrays must have the same length');
  }

  let stored = 0;
  const batchSize = 50;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchChunks = chunks.slice(i, i + batchSize);
    const batchEmbeddings = embeddings.slice(i, i + batchSize);

    const rows = batchChunks.map((chunk, idx) => ({
      embedding_id: chunk.chunk_id,
      manual_id: chunk.manual_id,
      chunk_text: chunk.text,
      chunk_index: chunk.chunk_index,
      parent_chunk_id: chunk.parent_chunk_id || null,
      page_number: chunk.page_number || null,
      section_title: chunk.section_title || null,
      embedding: JSON.stringify(batchEmbeddings[idx]),
      token_count: chunk.token_count,
      chunk_type: chunk.parent_chunk_id ? 'child' : 'parent',
      metadata: chunk.metadata,
    }));

    const { error } = await supabase.from('vector_embeddings').insert(rows);

    if (error) {
      console.warn(`[RAG Pipeline] Batch insert error at index ${i}:`, error);
    } else {
      stored += batchChunks.length;
    }
  }

  return stored;
}

// ---------------------------------------------------------------------------
// 5. Full processing pipeline orchestrator
// ---------------------------------------------------------------------------

/**
 * Process a manual PDF end-to-end:
 *   1. Fetch PDF text content
 *   2. Chunk hierarchically
 *   3. Generate embeddings
 *   4. Store in pgvector
 *   5. Update manual status
 *
 * Returns a processing job status object.
 */
export async function processManual(
  manualId: string,
  pdfUrl: string,
  vehicle: VehicleLookup
): Promise<ManualProcessingJob> {
  const job: ManualProcessingJob = {
    job_id: uuid(),
    manual_id: manualId,
    vehicle,
    pdf_url: pdfUrl,
    status: 'pending',
    progress: 0,
    chunks_created: 0,
    embeddings_created: 0,
    started_at: new Date().toISOString(),
  };

  try {
    // Update status → downloading
    await updateManualStatus(manualId, 'processing');
    job.status = 'downloading';
    job.progress = 10;

    // Step 1: Fetch and extract text from PDF
    // In a production system this would use PyMuPDF4LLM server-side.
    // For the web runtime, we extract what we can from a text-based response.
    const pdfText = await fetchPdfText(pdfUrl);
    if (!pdfText || pdfText.length < 100) {
      throw new Error('Failed to extract sufficient text from PDF');
    }

    job.status = 'parsing';
    job.progress = 30;

    // Step 2: Hierarchical chunking
    job.status = 'chunking';
    const chunks = chunkManualText(pdfText, manualId, vehicle);
    job.chunks_created = chunks.length;
    job.progress = 50;

    if (chunks.length === 0) {
      throw new Error('No chunks generated from PDF text');
    }

    // Step 3: Generate embeddings
    job.status = 'embedding';
    const texts = chunks.map((c) => c.text);
    const embeddings = await generateEmbeddings(texts);
    job.embeddings_created = embeddings.length;
    job.progress = 80;

    // Step 4: Store in pgvector
    const stored = await storeChunksWithEmbeddings(chunks, embeddings);
    job.progress = 95;

    // Step 5: Update manual record
    await updateManualStatus(manualId, 'completed');
    await supabase
      .from('manuals')
      .update({
        processed: true,
        page_count: estimatePageCount(pdfText),
      })
      .eq('manual_id', manualId);

    job.status = 'completed';
    job.progress = 100;
    job.completed_at = new Date().toISOString();

    console.log(
      `[RAG Pipeline] Manual ${manualId} processed: ${stored} chunks stored for ${vehicle.year} ${vehicle.make} ${vehicle.model}`
    );
  } catch (err) {
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : 'Unknown error';
    await updateManualStatus(manualId, 'failed');
    console.error('[RAG Pipeline] Processing failed:', err);
  }

  return job;
}

/**
 * Fetch text content from a PDF URL.
 * In a real production system this would call a server-side
 * PyMuPDF4LLM or Mistral OCR service. For now, we attempt
 * to read text from the PDF response directly.
 */
async function fetchPdfText(pdfUrl: string): Promise<string> {
  try {
    const res = await fetch(pdfUrl);
    if (!res.ok) {
      throw new Error(`PDF fetch failed: ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || '';

    // If the response is already text (some services return extracted text)
    if (contentType.includes('text/')) {
      return res.text();
    }

    // For actual PDF binary data, we would need a server-side PDF parser.
    // Return the raw text extraction as a placeholder.
    // In production, route to a /api/parse-pdf endpoint running PyMuPDF4LLM.
    const buffer = await res.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = textDecoder.decode(buffer);

    // Basic PDF text extraction – pull out text between stream markers
    const textParts: string[] = [];
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    while ((match = streamRegex.exec(rawText)) !== null) {
      const content = match[1];
      // Filter to printable ASCII content
      const printable = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
      if (printable.length > 20) {
        textParts.push(printable);
      }
    }

    // If stream extraction found content, use it
    if (textParts.length > 0) {
      return textParts.join('\n\n');
    }

    // Last resort: extract anything that looks like readable text
    const readableText = rawText
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{3,}/g, '\n')
      .trim();

    return readableText;
  } catch (err) {
    console.warn('[RAG Pipeline] PDF text extraction failed:', err);
    return '';
  }
}

/**
 * Estimate page count from text length.
 */
function estimatePageCount(text: string): number {
  // Average owner's manual page has ~500 words / ~3000 chars
  return Math.max(1, Math.ceil(text.length / 3000));
}

/**
 * Update manual processing status in Supabase.
 */
async function updateManualStatus(
  manualId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<void> {
  await supabase
    .from('manuals')
    .update({ processing_status: status })
    .eq('manual_id', manualId);
}
