/**
 * Ask Ambedkar — Vector Retrieval Engine
 * 
 * Executes dense vector semantic search against indexed primary source embeddings
 * using cosine similarity and strict source authority filtering.
 */

import { CorpusDataset, resolveProvenanceForPassage } from './corpus-loader';
import { isAuthoritativeSource } from './authority';
import { DEFAULT_RETRIEVAL_CONFIG, RetrievalConfig } from './config';
import { searchVectorIndex } from './vector-index';
import {
  EmbeddingProvider,
  FutureRetrievalEngine,
  SearchQuery,
  SearchQueryFilters,
  SearchResult,
  SearchResultItem,
  VectorIndexData,
} from './types';
import { sanitizeQuestion } from '../question_processing';

export class VectorRetrievalEngine implements FutureRetrievalEngine {
  private vectorIndex: VectorIndexData;
  private embeddingProvider: EmbeddingProvider;
  private corpus: CorpusDataset;
  private config: RetrievalConfig;

  constructor(
    vectorIndex: VectorIndexData,
    embeddingProvider: EmbeddingProvider,
    corpus: CorpusDataset,
    config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG
  ) {
    this.vectorIndex = vectorIndex;
    this.embeddingProvider = embeddingProvider;
    this.corpus = corpus;
    this.config = config;
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    const sanitizedText = sanitizeQuestion(query.query || '');

    if (!sanitizedText || sanitizedText.length < 2) {
      return {
        query: query.query,
        items: [],
        totalFound: 0,
        executionTimeMs: Date.now() - startTime,
        retrievalMethod: 'vector',
      };
    }

    if (!this.embeddingProvider.isAvailable()) {
      throw new Error('Vector retrieval is unavailable: embedding provider is not configured.');
    }

    // 1. Build candidate filter set
    const filterDocIds = this.resolveFilterDocIds(query.filters);
    if (filterDocIds.size === 0) {
      return {
        query: query.query,
        items: [],
        totalFound: 0,
        executionTimeMs: Date.now() - startTime,
        retrievalMethod: 'vector',
      };
    }

    // 2. Generate embedding for user query
    const queryVector = await this.embeddingProvider.embedQuery(sanitizedText);
    const topK = query.topK || this.config.defaultTopK;

    // 3. Search vector index
    const vectorCandidates = searchVectorIndex(this.vectorIndex, queryVector, filterDocIds, topK);

    // 4. Construct SearchResultItems with provenance
    const items: SearchResultItem[] = [];

    for (const cand of vectorCandidates) {
      const passage = this.corpus.passages.get(cand.passageId);
      if (!passage) continue;

      const source = this.corpus.sources.get(passage.sourceId);
      if (!source) continue;

      const edition = passage.editionId ? this.corpus.editions.get(passage.editionId) : undefined;
      const provenance = resolveProvenanceForPassage(passage, this.corpus);
      if (!provenance) continue;

      items.push({
        passage,
        source,
        edition,
        provenance,
        relevanceScore: cand.normalizedScore,
        retrievalMethod: 'vector',
        scoreBreakdown: {
          vectorScore: cand.cosineSimilarity,
          normalizedVectorScore: cand.normalizedScore,
        },
      });
    }

    return {
      query: query.query,
      items,
      totalFound: vectorCandidates.length,
      executionTimeMs: Date.now() - startTime,
      retrievalMethod: 'vector',
    };
  }

  private resolveFilterDocIds(filters?: SearchQueryFilters): Set<string> {
    const eligibleDocIds = new Set<string>();

    for (const [passageId, passage] of this.corpus.passages.entries()) {
      const source = this.corpus.sources.get(passage.sourceId);
      if (!source) continue;

      if (!filters?.classifications || filters.classifications.length === 0) {
        if (!isAuthoritativeSource(source)) continue;
      } else {
        if (!filters.classifications.includes(source.classification)) continue;
      }

      if (filters?.sourceTypes && filters.sourceTypes.length > 0) {
        if (!filters.sourceTypes.includes(source.sourceType)) continue;
      }

      if (filters?.statuses && filters.statuses.length > 0) {
        if (!filters.statuses.includes(source.status)) continue;
      }

      if (filters?.sourceIds && filters.sourceIds.length > 0) {
        if (!filters.sourceIds.includes(source.id)) continue;
      }

      if (filters?.editionIds && filters.editionIds.length > 0) {
        if (!passage.editionId || !filters.editionIds.includes(passage.editionId)) continue;
      }

      if (filters?.yearRange) {
        const year = source.year;
        if (year !== undefined) {
          if (filters.yearRange.start !== undefined && year < filters.yearRange.start) continue;
          if (filters.yearRange.end !== undefined && year > filters.yearRange.end) continue;
        }
      }

      eligibleDocIds.add(passageId);
    }

    return eligibleDocIds;
  }
}
