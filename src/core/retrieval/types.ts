/**
 * Retrieval Domain Module — Types
 * 
 * Defines contracts for primary source document retrieval,
 * supporting hybrid (full-text + vector) search in future segments.
 */

import { PrimarySourceType, SourcePassage } from '../sources/types';

export interface RetrievalFilter {
  sourceTypes?: PrimarySourceType[];
  works?: string[];
  yearStart?: number;
  yearEnd?: number;
  languages?: string[];
}

export interface RetrievalQuery {
  queryText: string;
  topK?: number;
  filter?: RetrievalFilter;
  includeFullProvenance?: boolean;
}

export interface ScoredPassage {
  passage: SourcePassage;
  score: number;
  retrievalMethod: 'full_text' | 'vector' | 'hybrid';
}

export interface RetrievalResult {
  query: string;
  totalFound: number;
  passages: ScoredPassage[];
  executionTimeMs: number;
}

/**
 * Common retrieval engine interface to ensure future vector/text search
 * implementations remain swappable and independently testable.
 */
export interface RetrievalEngine {
  retrieve(query: RetrievalQuery): Promise<RetrievalResult>;
}
