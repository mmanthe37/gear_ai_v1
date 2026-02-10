/**
 * Gear AI CoPilot - Services Index
 *
 * Central export point for all service modules.
 */

// VIN decoding (NHTSA vPIC)
export {
  decodeVIN,
  getMakesForYear,
  getModelsForMake,
  validateVINChecksum,
} from './vin-decoder';

// Owner's manual retrieval pipeline
export {
  retrieveManual,
  getRecalls,
  getSafetyRatings,
  getVehicleReport,
  resolveVehicle,
  findIndexedManual,
  createManualRecord,
} from './manual-retrieval';

// RAG pipeline (chunking, embeddings, processing)
export {
  chunkManualText,
  generateEmbeddings,
  generateQueryEmbedding,
  storeChunksWithEmbeddings,
  processManual,
} from './rag-pipeline';

// Two-stage search (BM25 + semantic)
export {
  searchManual,
  quickSearch,
} from './manual-search';

// AI chat service
export {
  generateAIResponse,
  searchManualChunks,
  generateEmbedding,
  processManualPDF,
} from './ai-service';

// Diagnostics (CarMD integration)
export {
  analyzeDTC,
  getCommonDTCInfo,
} from './diagnostic-service';

// Health check
export {
  getHealthStatus,
  validateEnvironment,
} from './health-check';
