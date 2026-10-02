/**
 * Retrieval Domain Module — Types & Contracts
 * 
 * Segment 5: Hybrid Retrieval, BM25 Lexical Indexing & Vector Search Contracts.
 * Preserves Segment 3 canonical contracts while introducing score transparency,
 * embedding abstractions, and index serialization structures.
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
// 1. Search Query & Filters
// ============================================================================

export interface SearchQueryFilters {
  /** Filter by controlled source categories (BOOK, SPEECH, CAD, etc.) */
  sourceTypes?: SourceCategory[];

  /** Filter by classification (PRIMARY only by default for Ask Ambedkar answers) */
  classifications?: SourceClassification[];

  /** Filter by verification status (VERIFIED / PUBLISHED) */
  statuses?: SourceStatus[];

  /** Target specific source IDs */
  sourceIds?: string[];

  /** Target specific editions */
  editionIds?: string[];

  /** Target specific language codes (e.g., 'en', 'mr') */
  languages?: string[];

  /** Restrict to publication/delivery year range */
  yearRange?: {
    start?: number;
    end?: number;
  };
}

export interface SearchQuery {
  /** The natural language question, keyword query, or exact phrase */
  query: string;

  /** Language of the user query */
  language?: string;

  /** Desired response / source language */
  targetLanguage?: string;

  /** Metadata filters */
  filters?: SearchQueryFilters;

  /** Maximum candidate passages to return */
  topK?: number;
}

// ============================================================================
// 2. Score Transparency & Candidate Structures
// ============================================================================

export interface ScoreBreakdown {
  /** Raw BM25 lexical score */
  lexicalScore?: number;

  /** Min-max normalized lexical score (0.0 to 1.0) */
  normalizedLexicalScore?: number;

  /** Raw cosine vector similarity score (-1.0 to 1.0) */
  vectorScore?: number;

  /** Normalized vector score (0.0 to 1.0) */
  normalizedVectorScore?: number;

  /** Combined weighted hybrid score (0.0 to 1.0) */
  hybridScore?: number;

  /** Boost added for exact phrase match */
  exactPhraseBonus?: number;
}

export interface ScoredCandidate {
  passageId: string;
  relevanceScore: number;
  retrievalMethod: 'full_text' | 'vector' | 'hybrid';
  scoreBreakdown: ScoreBreakdown;
  matchHighlights?: string[];
}

export interface SearchResultItem {
  /** Retrieved atomic passage with immutable originalText */
  passage: Passage;

  /** Parent source entity */
  source: Source;

  /** Specific edition cited if catalogued */
  edition?: Edition;

  /** Complete provenance and academic citation */
  provenance: ProvenanceRecord;

  /** Final relevance / similarity score (0.0 to 1.0) */
  relevanceScore: number;

  /** Method used for retrieval */
  retrievalMethod: 'full_text' | 'vector' | 'hybrid';

  /** Highlighted text excerpts for search matching */
  matchHighlights?: string[];

  /** Full score breakdown for debugging and evaluation */
  scoreBreakdown?: ScoreBreakdown;
}

export interface SearchResult {
  query: string;
  items: SearchResultItem[];
  totalFound: number;
  executionTimeMs: number;
  retrievalMethod?: 'full_text' | 'vector' | 'hybrid';
}

export interface FutureRetrievalEngine {
  search(query: SearchQuery): Promise<SearchResult>;
}

// ============================================================================
// 3. Embedding Provider Abstraction
// ============================================================================

export interface EmbeddingProvider {
  readonly id: string;
  readonly modelName: string;
  readonly dimensions: number;

  /** Generates a dense vector embedding for a search query */
  embedQuery(text: string): Promise<number[]>;

  /** Generates dense vector embeddings for an array of passages */
  embedDocuments(texts: string[]): Promise<number[][]>;

  /** Checks if the provider is fully configured with valid credentials */
  isAvailable(): boolean;
}

// ============================================================================
// 4. Index Storage & Serialization Structures
// ============================================================================

export interface PostingItem {
  docId: string;
  termFreq: number;
}

export interface DocumentLexicalMetadata {
  passageId: string;
  sourceId: string;
  editionId?: string;
  sectionId?: string;
  chapter?: string;
  section?: string;
  sourceTitle: string;
  contentHash: string;
}

export interface Bm25IndexData {
  schemaVersion: number;
  k1: number;
  b: number;
  totalDocs: number;
  avgDocLength: number;
  docLengths: Record<string, number>;
  invertedIndex: Record<string, PostingItem[]>;
  docMetadata: Record<string, DocumentLexicalMetadata>;
  updatedAt: string;
}

export interface VectorRecord {
  passageId: string;
  vector: number[];
  contentHash: string;
}

export interface VectorIndexData {
  schemaVersion: number;
  embeddingModel: string;
  dimensions: number;
  records: VectorRecord[];
  updatedAt: string;
}

export interface IndexManifest {
  schemaVersion: number;
  corpusHash: string;
  passageCount: number;
  sourceCount: number;
  createdAt: string;
  updatedAt: string;
  lexicalIndex: {
    type: 'bm25';
    version: string;
    k1: number;
    b: number;
    totalTerms: number;
    avgDocLength: number;
  };
  vectorIndex: {
    enabled: boolean;
    provider: string;
    model: string;
    dimensions: number;
    vectorCount: number;
  };
}

// ============================================================================
// 5. Legacy / Compatibility Retrieval Contracts
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
