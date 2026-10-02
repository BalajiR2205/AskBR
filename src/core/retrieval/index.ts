/**
 * Ask Ambedkar — Retrieval Domain Module
 * 
 * Segment 5: Hybrid Retrieval Subsystem
 * Unifies BM25 lexical search, dense vector retrieval, authority filtering,
 * score normalization, and provenance-aware search results.
 */

import { loadCorpusFromDirectory } from './corpus-loader';
import { DEFAULT_RETRIEVAL_CONFIG, RetrievalConfig } from './config';
import { HybridRetrievalEngine } from './hybrid-engine';
import { EmbeddingProvider } from './types';
import { getEnvEmbeddingProvider } from './embeddings';
import { buildBm25Index } from './bm25';
import { createEmptyVectorIndex } from './vector-index';
import { RetrievalEngine, RetrievalQuery, RetrievalResult } from './types';

export * from './types';
export * from './config';
export * from './tokenizer';
export * from './authority';
export * from './corpus-loader';
export * from './bm25';
export * from './vector-index';
export * from './embeddings';
export * from './manifest';
export * from './lexical-engine';
export * from './vector-engine';
export * from './hybrid-engine';
export * from './evaluation';

/**
 * Convenience factory to create a HybridRetrievalEngine from corpus and index directories.
 */
export async function createHybridRetrievalEngine(options?: {
  corpusDir?: string;
  indexDir?: string;
  config?: RetrievalConfig;
  embeddingProvider?: EmbeddingProvider;
}): Promise<HybridRetrievalEngine> {
  const corpusDir = options?.corpusDir || 'data/corpus';
  const dataset = await loadCorpusFromDirectory(corpusDir);
  const config = options?.config || DEFAULT_RETRIEVAL_CONFIG;
  const embeddingProvider = options?.embeddingProvider || getEnvEmbeddingProvider();

  const bm25Index = buildBm25Index(
    Array.from(dataset.passages.values()),
    dataset.sources,
    dataset.sections,
    config
  );

  const vectorIndex = createEmptyVectorIndex();

  return new HybridRetrievalEngine(
    bm25Index,
    dataset,
    vectorIndex,
    embeddingProvider,
    config
  );
}

/**
 * Segment 0/3 compatibility placeholder engine.
 */
export class PlaceholderRetrievalEngine implements RetrievalEngine {
  async retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
    const startTime = Date.now();
    return {
      query: query.queryText,
      totalFound: 0,
      passages: [],
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export const defaultRetrievalEngine = new PlaceholderRetrievalEngine();
