/**
 * Retrieval Domain Module
 * 
 * Segment 0 Foundation: Retrieval interface contracts and placeholder service.
 * In future segments, this will integrate BM25 and vector search against indexed primary sources.
 */

export * from './types';

import { RetrievalEngine, RetrievalQuery, RetrievalResult } from './types';

export class PlaceholderRetrievalEngine implements RetrievalEngine {
  async retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
    const startTime = Date.now();
    // Segment 0: Clean foundation — no fake data is returned.
    return {
      query: query.queryText,
      totalFound: 0,
      passages: [],
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export const defaultRetrievalEngine = new PlaceholderRetrievalEngine();
