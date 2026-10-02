/**
 * Retrieval Domain Module — Types & Future Retrieval Contracts
 * 
 * Segment 3: Canonical Future Retrieval Contract for primary source retrieval.
 * Designed so that future vector/BM25 retrieval implementations remain cleanly decoupled.
 */

import {
  Edition,
  PrimarySourceType,
  Source,
  SourceCategory,
  SourceClassification,
  SourcePassage,
  SourceStatus,
} from '../sources/types';
import { Passage } from '../passages/types';
import { ProvenanceRecord } from '../provenance/types';

// ============================================================================
// 1. Future Retrieval Contract (Segment 3 Architecture)
// ============================================================================

export interface SearchQueryFilters {
  /** Filter by controlled source categories */
  sourceTypes?: SourceCategory[];

  /** Filter by classification (PRIMARY only by default for Ask Ambedkar answers) */
  classifications?: SourceClassification[];

  /** Filter by verification status (VERIFIED / PUBLISHED) */
  statuses?: SourceStatus[];

  /** Target specific source IDs */
  sourceIds?: string[];

  /** Target specific editions */
  editionIds?: string[];

  /** Restrict to publication/delivery year range */
  yearRange?: {
    start?: number;
    end?: number;
  };
}

export interface SearchQuery {
  /** The natural language question or keyword query */
  query: string;

  /** Language of the user query */
  language?: string;

  /** Desired response / source language */
  targetLanguage?: string;

  /** Metadata filters */
  filters?: SearchQueryFilters;

  /** Maximum candidate passages to retrieve */
  topK?: number;
}

export interface SearchResultItem {
  /** Retrieved atomic passage with immutable originalText */
  passage: Passage;

  /** Parent source entity */
  source: Source;

  /** Specific edition cited if catalogued */
  edition?: Edition;

  /** Complete provenance and citation information */
  provenance: ProvenanceRecord;

  /** Relevance / similarity score (0.0 to 1.0) */
  relevanceScore: number;

  /** Method used for retrieval */
  retrievalMethod: 'full_text' | 'vector' | 'hybrid';

  /** Highlighted text excerpts for search matching */
  matchHighlights?: string[];
}

export interface SearchResult {
  query: string;
  items: SearchResultItem[];
  totalFound: number;
  executionTimeMs: number;
}

export interface FutureRetrievalEngine {
  search(query: SearchQuery): Promise<SearchResult>;
}

// ============================================================================
// 2. Legacy / Compatibility Retrieval Contracts
// ============================================================================

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

export interface RetrievalEngine {
  retrieve(query: RetrievalQuery): Promise<RetrievalResult>;
}
