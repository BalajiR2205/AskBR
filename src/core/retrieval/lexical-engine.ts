/**
 * Ask Ambedkar — Lexical BM25 Retrieval Engine
 * 
 * Executes full-text primary source search using BM25, query term saturation,
 * exact phrase detection, and strict source authority filtering.
 */

import { CorpusDataset, resolveProvenanceForPassage } from './corpus-loader';
import { isAuthoritativeSource } from './authority';
import { scoreBm25 } from './bm25';
import { DEFAULT_RETRIEVAL_CONFIG, RetrievalConfig } from './config';
import { DefaultTokenizer, Tokenizer } from './tokenizer';
import {
  Bm25IndexData,
  FutureRetrievalEngine,
  SearchQuery,
  SearchQueryFilters,
  SearchResult,
  SearchResultItem,
} from './types';
import { sanitizeQuestion } from '../question_processing';

export class LexicalRetrievalEngine implements FutureRetrievalEngine {
  private bm25Index: Bm25IndexData;
  private corpus: CorpusDataset;
  private config: RetrievalConfig;
  private tokenizer: Tokenizer;

  constructor(
    bm25Index: Bm25IndexData,
    corpus: CorpusDataset,
    config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG,
    tokenizer: Tokenizer = new DefaultTokenizer()
  ) {
    this.bm25Index = bm25Index;
    this.corpus = corpus;
    this.config = config;
    this.tokenizer = tokenizer;
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
        retrievalMethod: 'full_text',
      };
    }

    // 1. Build candidate filter set honoring authority and explicit query filters
    const filterDocIds = this.resolveFilterDocIds(query.filters);
    if (filterDocIds.size === 0) {
      return {
        query: query.query,
        items: [],
        totalFound: 0,
        executionTimeMs: Date.now() - startTime,
        retrievalMethod: 'full_text',
      };
    }

    // 2. Tokenize search query
    const queryTerms = this.tokenizer.tokenize(sanitizedText);
    if (queryTerms.length === 0) {
      return {
        query: query.query,
        items: [],
        totalFound: 0,
        executionTimeMs: Date.now() - startTime,
        retrievalMethod: 'full_text',
      };
    }

    // 3. Score against BM25 index
    const scoredCandidates = scoreBm25(
      this.bm25Index,
      queryTerms,
      sanitizedText,
      this.corpus.passages,
      filterDocIds,
      this.config
    );

    const topK = query.topK || this.config.defaultTopK;
    const topCandidates = scoredCandidates.slice(0, topK);

    // 4. Construct SearchResultItems with full provenance
    const items: SearchResultItem[] = [];

    for (const cand of topCandidates) {
      const passage = this.corpus.passages.get(cand.docId);
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
        retrievalMethod: 'full_text',
        matchHighlights: cand.matchHighlights,
        scoreBreakdown: {
          lexicalScore: cand.rawScore,
          normalizedLexicalScore: cand.normalizedScore,
          exactPhraseBonus: cand.exactPhraseBonus,
        },
      });
    }

    return {
      query: query.query,
      items,
      totalFound: scoredCandidates.length,
      executionTimeMs: Date.now() - startTime,
      retrievalMethod: 'full_text',
    };
  }

  /**
   * Resolves the set of eligible passage IDs meeting authority and metadata constraints.
   */
  private resolveFilterDocIds(filters?: SearchQueryFilters): Set<string> {
    const eligibleDocIds = new Set<string>();

    for (const [passageId, passage] of this.corpus.passages.entries()) {
      const source = this.corpus.sources.get(passage.sourceId);
      if (!source) continue;

      // Rule 1: Must satisfy authoritative source predicate by default unless classifications override
      if (!filters?.classifications || filters.classifications.length === 0) {
        if (!isAuthoritativeSource(source)) {
          continue;
        }
      } else {
        if (!filters.classifications.includes(source.classification)) {
          continue;
        }
      }

      // Rule 2: Source Category filter
      if (filters?.sourceTypes && filters.sourceTypes.length > 0) {
        if (!filters.sourceTypes.includes(source.sourceType)) {
          continue;
        }
      }

      // Rule 3: Source Status filter
      if (filters?.statuses && filters.statuses.length > 0) {
        if (!filters.statuses.includes(source.status)) {
          continue;
        }
      }

      // Rule 4: Specific source IDs
      if (filters?.sourceIds && filters.sourceIds.length > 0) {
        if (!filters.sourceIds.includes(source.id)) {
          continue;
        }
      }

      // Rule 5: Specific edition IDs
      if (filters?.editionIds && filters.editionIds.length > 0) {
        if (!passage.editionId || !filters.editionIds.includes(passage.editionId)) {
          continue;
        }
      }

      // Rule 6: Year Range filter
      if (filters?.yearRange) {
        const year = source.year;
        if (year !== undefined) {
          if (filters.yearRange.start !== undefined && year < filters.yearRange.start) {
            continue;
          }
          if (filters.yearRange.end !== undefined && year > filters.yearRange.end) {
            continue;
          }
        }
      }

      // Rule 7: Language filter
      if (filters?.languages && filters.languages.length > 0) {
        if (!filters.languages.includes(passage.language)) {
          continue;
        }
      }

      eligibleDocIds.add(passageId);
    }

    return eligibleDocIds;
  }
}
