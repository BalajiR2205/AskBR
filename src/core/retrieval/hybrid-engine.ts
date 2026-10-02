/**
 * Ask Ambedkar — Hybrid Retrieval Engine
 * 
 * Orchestrates BM25 lexical retrieval and dense vector search:
 * 1. Pre-filters by strict source authority and metadata constraints.
 * 2. Retrieves larger candidate pools (topK * candidateMultiplier) from both branches.
 * 3. Normalizes component scores across candidates.
 * 4. Fuses scores using configurable weights:
 *    hybridScore = (lexicalWeight * normLexical) + (vectorWeight * normVector).
 * 5. Gracefully falls back to pure lexical retrieval if vector index or provider is unavailable.
 * 6. Deduplicates candidates and attaches complete provenance.
 */

import { CorpusDataset, resolveProvenanceForPassage } from './corpus-loader';
import { isAuthoritativeSource } from './authority';
import { scoreBm25 } from './bm25';
import { DEFAULT_RETRIEVAL_CONFIG, RetrievalConfig } from './config';
import { DefaultTokenizer, Tokenizer } from './tokenizer';
import { searchVectorIndex } from './vector-index';
import {
  Bm25IndexData,
  EmbeddingProvider,
  FutureRetrievalEngine,
  RetrievalEngine,
  RetrievalQuery,
  RetrievalResult,
  ScoredCandidate,
  ScoredPassage,
  SearchQuery,
  SearchQueryFilters,
  SearchResult,
  SearchResultItem,
  VectorIndexData,
} from './types';
import { PrimarySourceType, SourceCategory } from '../sources/types';
import { sanitizeQuestion } from '../question_processing';

function toLegacySourceType(cat: SourceCategory): PrimarySourceType {
  const map: Record<SourceCategory, PrimarySourceType> = {
    BOOK: 'book',
    SPEECH: 'speech',
    INTERVIEW: 'interview',
    CONSTITUENT_ASSEMBLY: 'constituent_assembly_debate',
    LETTER: 'letter',
    EDITORIAL: 'editorial',
    ARTICLE: 'article',
  };
  return map[cat] || cat;
}

export class HybridRetrievalEngine implements FutureRetrievalEngine, RetrievalEngine {
  private bm25Index: Bm25IndexData;
  private vectorIndex?: VectorIndexData;
  private embeddingProvider?: EmbeddingProvider;
  private corpus: CorpusDataset;
  private config: RetrievalConfig;
  private tokenizer: Tokenizer;

  constructor(
    bm25Index: Bm25IndexData,
    corpus: CorpusDataset,
    vectorIndex?: VectorIndexData,
    embeddingProvider?: EmbeddingProvider,
    config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG,
    tokenizer: Tokenizer = new DefaultTokenizer()
  ) {
    this.bm25Index = bm25Index;
    this.corpus = corpus;
    this.vectorIndex = vectorIndex;
    this.embeddingProvider = embeddingProvider;
    this.config = config;
    this.tokenizer = tokenizer;
  }

  /**
   * Primary search entry point implementing FutureRetrievalEngine contract.
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    const rawQuery = query.query || '';
    const sanitizedText = sanitizeQuestion(rawQuery);

    // 1. Guard against empty, whitespace, or degenerate queries
    if (!sanitizedText || sanitizedText.length < 2) {
      return {
        query: rawQuery,
        items: [],
        totalFound: 0,
        executionTimeMs: Date.now() - startTime,
        retrievalMethod: 'full_text',
      };
    }

    const topK = query.topK || this.config.defaultTopK;
    const poolSize = topK * this.config.candidateMultiplier;

    // 2. Resolve eligible candidate doc IDs based on authority and filters
    const filterDocIds = this.resolveFilterDocIds(query.filters);
    if (filterDocIds.size === 0) {
      return {
        query: rawQuery,
        items: [],
        totalFound: 0,
        executionTimeMs: Date.now() - startTime,
        retrievalMethod: 'full_text',
      };
    }

    // 3. Determine vector availability
    const isVectorAvailable = Boolean(
      this.vectorIndex &&
      this.embeddingProvider &&
      this.embeddingProvider.isAvailable() &&
      this.vectorIndex.records.length > 0
    );

    // 4. Lexical BM25 candidate retrieval
    const queryTerms = this.tokenizer.tokenize(sanitizedText);
    const lexicalCandidates = queryTerms.length > 0
      ? scoreBm25(
          this.bm25Index,
          queryTerms,
          sanitizedText,
          this.corpus.passages,
          filterDocIds,
          this.config
        ).slice(0, poolSize)
      : [];

    // 5. Vector candidate retrieval (if configured and available)
    let vectorCandidates: { passageId: string; cosineSimilarity: number; normalizedScore: number }[] = [];
    if (isVectorAvailable && this.vectorIndex && this.embeddingProvider) {
      try {
        const queryVector = await this.embeddingProvider.embedQuery(sanitizedText);
        vectorCandidates = searchVectorIndex(this.vectorIndex, queryVector, filterDocIds, poolSize);
      } catch {
        // Fall back gracefully to lexical retrieval without failing the search
        vectorCandidates = [];
      }
    }

    // 6. Fusion & Score Normalization
    const candidateMap = new Map<string, ScoredCandidate>();

    // Index lexical candidates
    for (const lex of lexicalCandidates) {
      candidateMap.set(lex.docId, {
        passageId: lex.docId,
        relevanceScore: lex.normalizedScore,
        retrievalMethod: 'full_text',
        scoreBreakdown: {
          lexicalScore: lex.rawScore,
          normalizedLexicalScore: lex.normalizedScore,
          exactPhraseBonus: lex.exactPhraseBonus,
        },
        matchHighlights: lex.matchHighlights,
      });
    }

    // Merge or fuse vector candidates
    if (vectorCandidates.length > 0) {
      for (const vec of vectorCandidates) {
        const existing = candidateMap.get(vec.passageId);

        if (existing) {
          // Candidate appeared in both lexical and vector pools -> Hybrid fusion
          const normLex = existing.scoreBreakdown.normalizedLexicalScore || 0;
          const normVec = vec.normalizedScore;

          const hybridScore = Number(
            (this.config.lexicalWeight * normLex + this.config.vectorWeight * normVec).toFixed(4)
          );

          existing.relevanceScore = Math.min(1.0, Math.max(0.0, hybridScore));
          existing.retrievalMethod = 'hybrid';
          existing.scoreBreakdown.vectorScore = vec.cosineSimilarity;
          existing.scoreBreakdown.normalizedVectorScore = vec.normalizedScore;
          existing.scoreBreakdown.hybridScore = existing.relevanceScore;
        } else {
          // Candidate appeared only in vector pool
          const hybridScore = Number((this.config.vectorWeight * vec.normalizedScore).toFixed(4));
          candidateMap.set(vec.passageId, {
            passageId: vec.passageId,
            relevanceScore: Math.min(1.0, Math.max(0.0, hybridScore)),
            retrievalMethod: 'vector',
            scoreBreakdown: {
              vectorScore: vec.cosineSimilarity,
              normalizedVectorScore: vec.normalizedScore,
              hybridScore,
            },
          });
        }
      }
    }

    // 7. Sort merged candidates descending by relevance score
    const fusedList = Array.from(candidateMap.values());
    fusedList.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const topCandidates = fusedList.slice(0, topK);

    // 8. Construct final SearchResultItems with complete provenance
    const items: SearchResultItem[] = [];

    for (const cand of topCandidates) {
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
        relevanceScore: cand.relevanceScore,
        retrievalMethod: cand.retrievalMethod,
        matchHighlights: cand.matchHighlights,
        scoreBreakdown: cand.scoreBreakdown,
      });
    }

    // Overall retrieval method designation
    const overallMethod = isVectorAvailable && vectorCandidates.length > 0 ? 'hybrid' : 'full_text';

    return {
      query: rawQuery,
      items,
      totalFound: candidateMap.size,
      executionTimeMs: Date.now() - startTime,
      retrievalMethod: overallMethod,
    };
  }

  /**
   * Compatibility adapter implementing the legacy RetrievalEngine interface.
   */
  async retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
    const searchRes = await this.search({
      query: query.queryText,
      topK: query.topK,
    });

    const passages: ScoredPassage[] = searchRes.items.map((item) => ({
      passage: {
        id: item.passage.id,
        content: item.passage.originalText,
        provenance: {
          workTitle: item.source.title,
          author: item.provenance.author,
          dateOrYear: item.source.date || (item.source.year ? String(item.source.year) : undefined),
          sourceType: toLegacySourceType(item.source.sourceType),
          chapter: item.passage.chapter,
          section: item.passage.section,
          page: item.provenance.pageRange,
          originalLanguage: item.source.originalLanguage,
          originalText: item.passage.originalText,
          referenceInfo: item.source.sourceReference,
          volume: item.source.volume,
          archiveUrl: item.source.externalReference,
        },
        metadata: {
          normalizedText: item.passage.normalizedText,
          scoreBreakdown: item.scoreBreakdown,
        },
        createdAt: item.passage.createdAt,
      },
      score: item.relevanceScore,
      retrievalMethod: item.retrievalMethod,
    }));

    return {
      query: query.queryText,
      totalFound: searchRes.totalFound,
      passages,
      executionTimeMs: searchRes.executionTimeMs,
    };
  }

  /**
   * Evaluates authority constraints and metadata filters to determine eligible document IDs.
   */
  private resolveFilterDocIds(filters?: SearchQueryFilters): Set<string> {
    const eligibleDocIds = new Set<string>();

    for (const [passageId, passage] of this.corpus.passages.entries()) {
      const source = this.corpus.sources.get(passage.sourceId);
      if (!source) continue;

      // Rule 1: Authoritative Source predicate (PRIMARY, VERIFIED/PUBLISHED, Dr. B. R. Ambedkar)
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
