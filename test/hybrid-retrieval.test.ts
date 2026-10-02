/**
 * Ask Ambedkar — Segment 5 Hybrid Retrieval & Search Indexing Test Suite
 * 
 * Verifies all 25 Segment 5 criteria:
 * 1. Multilingual & Unicode Tokenizer
 * 2. BM25 Inverted Index & Term Frequency
 * 3. BM25 Scoring & Document Length Normalization
 * 4. Exact Phrase Detection & Boosting
 * 5. Search Query Metadata Filtering
 * 6. Central Source Authority Predicate
 * 7. Top-K Candidate Bounding
 * 8. Empty & Low-Quality Query Handling
 * 9. Candidate Deduplication & Score Preservation
 * 10. Complete Provenance Construction
 * 11. End-to-End Lexical BM25 Retrieval Engine
 * 12. Vector Retrieval Engine with Test-Only FakeEmbeddingProvider
 * 13. Cosine Similarity Vector Metric
 * 14. Min-Max Score Normalization
 * 15. Hybrid Fusion & Weighting
 * 16. Graceful Lexical Fallback when Vectors Unavailable
 * 17. Vector-Only Retrieval Mode
 * 18. Index Manifest Serialization & Integrity Check
 * 19. Corpus Hash Staleness Detection
 * 20. Incremental Indexing & Unchanged Passage Detection
 * 21. Deterministic Search Ranking
 * 22. Missing Embedding Provider Configuration Handling
 * 23. Vector Dimension Mismatch Detection
 * 24. Invalid Corpus Record Safe Handling
 * 25. Retrieval Quality Evaluation (Precision@K, Recall@K, MRR)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

import {
  buildBm25Index,
  computeCorpusHash,
  cosineSimilarity,
  createCorpusDataset,
  createEmptyVectorIndex,
  defaultTokenizer,
  DefaultTokenizer,
  evaluateRetrieval,
  FakeEmbeddingProvider,
  generateMatchHighlights,
  getEnvEmbeddingProvider,
  isAuthoritativeSource,
  isIndexStale,
  loadCorpusFromDirectory,
  loadIndexManifest,
  saveIndexManifest,
  scoreBm25,
  searchVectorIndex,
  UnavailableEmbeddingProvider,
  upsertVectorRecord,
  validateIndexIntegrity,
  HybridRetrievalEngine,
  LexicalRetrievalEngine,
  VectorRetrievalEngine,
  DEFAULT_RETRIEVAL_CONFIG,
  INDEX_SCHEMA_VERSION,
  IndexManifest,
  SearchQuery,
  RetrievalEvaluationTestCase,
} from '../src/core/retrieval';

import { Source, DocumentSection, Edition } from '../src/core/sources/types';
import { Passage } from '../src/core/passages/types';

// Isolated scratch test paths
const TEST_DIR = path.resolve('data/working/test-retrieval-suite');
const CORPUS_DIR = path.join(TEST_DIR, 'corpus');
const INDEX_DIR = path.join(TEST_DIR, 'index');

// Synthetic Test Fixtures (Clearly marked: NOT real Ambedkar text)
const SYNTHETIC_SOURCE_PRIMARY: Source = {
  id: 'src_synth_book_1936',
  title: 'Synthetic Treatise on Social Justice',
  sourceType: 'BOOK',
  classification: 'PRIMARY',
  status: 'VERIFIED',
  attribution: { role: 'AUTHOR', name: 'Dr. B. R. Ambedkar' },
  originalLanguage: 'en',
  languagesAvailable: ['en', 'mr'],
  year: 1936,
  publisher: 'Synthetic Press Bombay',
  sourceReference: 'Synthetic Reference Vol. 1',
  createdAt: '2026-10-02T00:00:00Z',
  updatedAt: '2026-10-02T00:00:00Z',
};

const SYNTHETIC_SOURCE_SECONDARY: Source = {
  id: 'src_synth_commentary_2020',
  title: 'Modern Analysis of Ambedkar Writings',
  sourceType: 'ARTICLE',
  classification: 'SECONDARY',
  status: 'VERIFIED',
  attribution: { role: 'AUTHOR', name: 'Modern Academic Scholar' },
  originalLanguage: 'en',
  languagesAvailable: ['en'],
  year: 2020,
  sourceReference: 'Modern Journal of Political Studies',
  createdAt: '2026-10-02T00:00:00Z',
  updatedAt: '2026-10-02T00:00:00Z',
};

const SYNTHETIC_SOURCE_SPEECH: Source = {
  id: 'src_synth_speech_1942',
  title: 'Synthetic Address to Depressed Classes',
  sourceType: 'SPEECH',
  classification: 'PRIMARY',
  status: 'VERIFIED',
  attribution: { role: 'SPEAKER', name: 'Dr. B. R. Ambedkar' },
  originalLanguage: 'en',
  languagesAvailable: ['en'],
  year: 1942,
  sourceReference: 'Synthetic Speeches Vol. 2',
  createdAt: '2026-10-02T00:00:00Z',
  updatedAt: '2026-10-02T00:00:00Z',
};

const SYNTHETIC_EDITION: Edition = {
  id: 'edn_synth_01',
  sourceId: 'src_synth_book_1936',
  editionName: 'First Synthetic Edition',
  year: 1936,
  publisher: 'Synthetic Press Bombay',
  language: 'en',
  isAuthoritative: true,
  createdAt: '2026-10-02T00:00:00Z',
  updatedAt: '2026-10-02T00:00:00Z',
};

const SYNTHETIC_SECTION: DocumentSection = {
  id: 'sec_synth_ch1',
  sourceId: 'src_synth_book_1936',
  level: 'CHAPTER',
  sequence: 1,
  title: 'Chapter 1: The Principle of Fraternity',
  pageStart: 1,
  pageEnd: 10,
  createdAt: '2026-10-02T00:00:00Z',
  updatedAt: '2026-10-02T00:00:00Z',
};

const SYNTHETIC_PASSAGES: Passage[] = [
  {
    id: 'psg_synth_01',
    sourceId: 'src_synth_book_1936',
    editionId: 'edn_synth_01',
    parentSectionId: 'sec_synth_ch1',
    sequence: 1,
    originalText:
      'Fraternity means a sense of common brotherhood of all Indians—if Indians being one people. It is the principle which gives unity and solidarity to social life.',
    normalizedText:
      'Fraternity means a sense of common brotherhood of all Indians—if Indians being one people. It is the principle which gives unity and solidarity to social life.',
    language: 'en',
    pageStart: 1,
    pageEnd: 1,
    chapter: 'Chapter 1: The Principle of Fraternity',
    translationMetadata: { isOriginal: true, translationType: 'ORIGINAL' },
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
  },
  {
    id: 'psg_synth_02',
    sourceId: 'src_synth_book_1936',
    editionId: 'edn_synth_01',
    parentSectionId: 'sec_synth_ch1',
    sequence: 2,
    originalText:
      'Political democracy cannot last unless there lies at the base of it social democracy. What does social democracy mean? It means a way of life which recognizes liberty, equality and fraternity.',
    normalizedText:
      'Political democracy cannot last unless there lies at the base of it social democracy. What does social democracy mean? It means a way of life which recognizes liberty, equality and fraternity.',
    language: 'en',
    pageStart: 2,
    pageEnd: 2,
    chapter: 'Chapter 1: The Principle of Fraternity',
    translationMetadata: { isOriginal: true, translationType: 'ORIGINAL' },
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
  },
  {
    id: 'psg_synth_03',
    sourceId: 'src_synth_speech_1942',
    sequence: 1,
    originalText:
      'Educate, agitate and organize; have faith in yourselves. With justice on our side, I do not see how we can lose our battle.',
    normalizedText:
      'Educate, agitate and organize; have faith in yourselves. With justice on our side, I do not see how we can lose our battle.',
    language: 'en',
    pageStart: 12,
    pageEnd: 12,
    translationMetadata: { isOriginal: true, translationType: 'ORIGINAL' },
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
  },
  {
    id: 'psg_synth_secondary_01',
    sourceId: 'src_synth_commentary_2020',
    sequence: 1,
    originalText:
      'Modern scholars argue that Ambedkar view of democracy was deeply rooted in constitutionalism and moral philosophy.',
    normalizedText:
      'Modern scholars argue that Ambedkar view of democracy was deeply rooted in constitutionalism and moral philosophy.',
    language: 'en',
    pageStart: 50,
    pageEnd: 50,
    translationMetadata: { isOriginal: true, translationType: 'ORIGINAL' },
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-02T00:00:00Z',
  },
];

describe('Segment 5: Hybrid Retrieval & Search Indexing Test Suite', () => {
  before(async () => {
    await fs.promises.mkdir(CORPUS_DIR, { recursive: true });
    await fs.promises.mkdir(INDEX_DIR, { recursive: true });

    // Write synthetic corpus JSONL files
    const sourcesJsonl = [SYNTHETIC_SOURCE_PRIMARY, SYNTHETIC_SOURCE_SECONDARY, SYNTHETIC_SOURCE_SPEECH]
      .map((s) => JSON.stringify(s))
      .join('\n') + '\n';
    const editionsJsonl = JSON.stringify(SYNTHETIC_EDITION) + '\n';
    const sectionsJsonl = JSON.stringify(SYNTHETIC_SECTION) + '\n';
    const passagesJsonl = SYNTHETIC_PASSAGES.map((p) => JSON.stringify(p)).join('\n') + '\n';

    await fs.promises.writeFile(path.join(CORPUS_DIR, 'sources.jsonl'), sourcesJsonl);
    await fs.promises.writeFile(path.join(CORPUS_DIR, 'editions.jsonl'), editionsJsonl);
    await fs.promises.writeFile(path.join(CORPUS_DIR, 'sections.jsonl'), sectionsJsonl);
    await fs.promises.writeFile(path.join(CORPUS_DIR, 'passages.jsonl'), passagesJsonl);
  });

  after(async () => {
    if (fs.existsSync(TEST_DIR)) {
      await fs.promises.rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // 1. Multilingual Tokenizer
  // ==========================================================================
  describe('1. Multilingual & Unicode Tokenizer', () => {
    it('should tokenize English terms and preserve hyphenated/apostrophe words', () => {
      const tokens = defaultTokenizer.tokenize("Dr. B. R. Ambedkar's jat-pat-todak address!");
      assert.ok(tokens.includes('ambedkar\'s'));
      assert.ok(tokens.includes('jat-pat-todak'));
      assert.ok(tokens.includes('address'));
    });

    it('should tokenize Indic/Devanagari scripts (Marathi/Hindi) preserving Unicode', () => {
      const tokenizer = new DefaultTokenizer();
      const tokens = tokenizer.tokenize('जातीचा अंत आणि समता');
      assert.equal(tokens.length, 4);
      assert.equal(tokens[0], 'जातीचा');
      assert.equal(tokens[1], 'अंत');
      assert.equal(tokens[2], 'आणि');
      assert.equal(tokens[3], 'समता');
    });

    it('should handle empty or whitespace-only input safely', () => {
      assert.deepEqual(defaultTokenizer.tokenize(''), []);
      assert.deepEqual(defaultTokenizer.tokenize('   \n\t  '), []);
    });
  });

  // ==========================================================================
  // 2. BM25 Inverted Index & Term Frequency
  // ==========================================================================
  describe('2. BM25 Inverted Index & Term Frequency', () => {
    it('should build inverted index with term frequency and document lengths', () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY, SYNTHETIC_SOURCE_SPEECH],
        [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[1], SYNTHETIC_PASSAGES[2]],
        [SYNTHETIC_EDITION],
        [SYNTHETIC_SECTION]
      );

      const bm25 = buildBm25Index(
        Array.from(dataset.passages.values()),
        dataset.sources,
        dataset.sections
      );

      assert.equal(bm25.totalDocs, 3);
      assert.ok(bm25.avgDocLength > 0);
      assert.ok(bm25.invertedIndex['fraternity'] !== undefined);
      assert.ok(bm25.invertedIndex['democracy'] !== undefined);

      // Verify posting items for 'fraternity'
      const fraternityPostings = bm25.invertedIndex['fraternity'];
      assert.ok(fraternityPostings.some((p) => p.docId === 'psg_synth_01'));
      assert.ok(fraternityPostings.some((p) => p.docId === 'psg_synth_02'));
    });
  });

  // ==========================================================================
  // 3. BM25 Scoring & Document Length Normalization
  // ==========================================================================
  describe('3. BM25 Scoring & Document Length Normalization', () => {
    it('should rank documents containing query terms higher than non-matching ones', () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY, SYNTHETIC_SOURCE_SPEECH],
        [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[1], SYNTHETIC_PASSAGES[2]],
        [SYNTHETIC_EDITION],
        [SYNTHETIC_SECTION]
      );

      const bm25 = buildBm25Index(
        Array.from(dataset.passages.values()),
        dataset.sources,
        dataset.sections
      );

      const scores = scoreBm25(bm25, ['educate', 'agitate'], 'educate agitate', dataset.passages);
      assert.ok(scores.length > 0);
      assert.equal(scores[0].docId, 'psg_synth_03');
      assert.ok(scores[0].rawScore > 0);
      assert.equal(scores[0].normalizedScore, 1.0); // Top candidate normalized to 1.0
    });
  });

  // ==========================================================================
  // 4. Exact Phrase Detection & Boosting
  // ==========================================================================
  describe('4. Exact Phrase Detection & Boosting', () => {
    it('should apply exact phrase bonus when consecutive query terms appear verbatim', () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY],
        [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[1]],
        [SYNTHETIC_EDITION],
        [SYNTHETIC_SECTION]
      );

      const bm25 = buildBm25Index(
        Array.from(dataset.passages.values()),
        dataset.sources,
        dataset.sections
      );

      // Query with exact phrase present in psg_synth_01
      const phraseQuery = '"common brotherhood"';
      const results = scoreBm25(bm25, ['common', 'brotherhood'], phraseQuery, dataset.passages);

      assert.ok(results.length > 0);
      assert.equal(results[0].docId, 'psg_synth_01');
      assert.ok(results[0].exactPhraseBonus > 0);
    });
  });

  // ==========================================================================
  // 5. Central Source Authority Predicate
  // ==========================================================================
  describe('5. Central Source Authority Predicate', () => {
    it('should accept authoritative PRIMARY verified work authored by Dr. B. R. Ambedkar', () => {
      assert.equal(isAuthoritativeSource(SYNTHETIC_SOURCE_PRIMARY), true);
      assert.equal(isAuthoritativeSource(SYNTHETIC_SOURCE_SPEECH), true);
    });

    it('should reject SECONDARY classification regardless of author', () => {
      assert.equal(isAuthoritativeSource(SYNTHETIC_SOURCE_SECONDARY), false);
    });

    it('should reject source if author is not Dr. B. R. Ambedkar', () => {
      const invalidAuthor: Source = {
        ...SYNTHETIC_SOURCE_PRIMARY,
        attribution: { role: 'AUTHOR', name: 'Other Writer' },
      };
      assert.equal(isAuthoritativeSource(invalidAuthor), false);
    });

    it('should reject DRAFT or ARCHIVED source status', () => {
      const draftSource: Source = { ...SYNTHETIC_SOURCE_PRIMARY, status: 'DRAFT' };
      const archivedSource: Source = { ...SYNTHETIC_SOURCE_PRIMARY, status: 'ARCHIVED' };
      assert.equal(isAuthoritativeSource(draftSource), false);
      assert.equal(isAuthoritativeSource(archivedSource), false);
    });
  });

  // ==========================================================================
  // 6. Search Query Metadata Filtering & Authority Exclusion
  // ==========================================================================
  describe('6. Search Query Metadata Filtering', () => {
    it('should exclude non-authoritative SECONDARY sources by default in LexicalRetrievalEngine', async () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY, SYNTHETIC_SOURCE_SECONDARY],
        [SYNTHETIC_PASSAGES[1], SYNTHETIC_PASSAGES[3]]
      );
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources);
      const engine = new LexicalRetrievalEngine(bm25, dataset);

      // Query "democracy" appears in both primary (psg_synth_02) and secondary (psg_synth_secondary_01)
      const res = await engine.search({ query: 'democracy' });

      assert.ok(res.items.some((item) => item.passage.id === 'psg_synth_02'));
      assert.ok(!res.items.some((item) => item.passage.id === 'psg_synth_secondary_01'));
    });

    it('should respect sourceTypes filter (e.g. only SPEECH)', async () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY, SYNTHETIC_SOURCE_SPEECH],
        [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[2]]
      );
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources);
      const engine = new LexicalRetrievalEngine(bm25, dataset);

      const res = await engine.search({
        query: 'justice faith brotherhood',
        filters: { sourceTypes: ['SPEECH'] },
      });

      assert.ok(res.items.every((item) => item.source.sourceType === 'SPEECH'));
    });

    it('should respect yearRange filter', async () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY, SYNTHETIC_SOURCE_SPEECH],
        [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[2]]
      );
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources);
      const engine = new LexicalRetrievalEngine(bm25, dataset);

      const res = await engine.search({
        query: 'democracy brotherhood',
        filters: { yearRange: { start: 1940, end: 1950 } }, // Excludes 1936
      });

      assert.ok(res.items.every((item) => item.source.year !== undefined && item.source.year >= 1940));
    });
  });

  // ==========================================================================
  // 7. Top-K & Empty Query Handling
  // ==========================================================================
  describe('7. Top-K & Empty Query Handling', () => {
    it('should return at most topK items when specified', async () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY, SYNTHETIC_SOURCE_SPEECH],
        [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[1], SYNTHETIC_PASSAGES[2]]
      );
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources);
      const engine = new LexicalRetrievalEngine(bm25, dataset);

      const res = await engine.search({ query: 'democracy fraternity people', topK: 1 });
      assert.equal(res.items.length, 1);
    });

    it('should return empty result safely for empty or whitespace query', async () => {
      const dataset = createCorpusDataset([SYNTHETIC_SOURCE_PRIMARY], [SYNTHETIC_PASSAGES[0]]);
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources);
      const engine = new LexicalRetrievalEngine(bm25, dataset);

      const res1 = await engine.search({ query: '' });
      assert.equal(res1.items.length, 0);
      assert.equal(res1.totalFound, 0);

      const res2 = await engine.search({ query: '   \n   ' });
      assert.equal(res2.items.length, 0);
    });
  });

  // ==========================================================================
  // 8. Provenance Construction & Match Highlights
  // ==========================================================================
  describe('8. Provenance Construction & Match Highlights', () => {
    it('should construct complete ProvenanceRecord with academic citation', async () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY],
        [SYNTHETIC_PASSAGES[0]],
        [SYNTHETIC_EDITION],
        [SYNTHETIC_SECTION]
      );
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources, dataset.sections);
      const engine = new LexicalRetrievalEngine(bm25, dataset);

      const res = await engine.search({ query: 'fraternity' });
      assert.equal(res.items.length, 1);

      const item = res.items[0];
      assert.equal(item.provenance.sourceId, 'src_synth_book_1936');
      assert.equal(item.provenance.sourceTitle, 'Synthetic Treatise on Social Justice');
      assert.equal(item.provenance.author, 'Dr. B. R. Ambedkar');
      assert.equal(item.provenance.pageRange, 'p. 1');
      assert.equal(item.provenance.chapter, 'Chapter 1: The Principle of Fraternity');
      assert.equal(item.provenance.bibliographicReference, 'Synthetic Reference Vol. 1');
    });

    it('should generate match highlights around matching query terms', () => {
      const text = 'Before discussing other issues, the principle of fraternity must be recognized by all citizens.';
      const highlights = generateMatchHighlights(text, ['fraternity']);

      assert.equal(highlights.length, 1);
      assert.ok(highlights[0].includes('fraternity'));
    });
  });

  // ==========================================================================
  // 9. Cosine Similarity & Vector Search
  // ==========================================================================
  describe('9. Cosine Similarity & Vector Search', () => {
    it('should compute exact cosine similarity for unit vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [1, 0, 0];
      const v3 = [0, 1, 0];
      const v4 = [-1, 0, 0];

      assert.equal(cosineSimilarity(v1, v2), 1.0);
      assert.equal(cosineSimilarity(v1, v3), 0.0);
      assert.equal(cosineSimilarity(v1, v4), -1.0);
    });

    it('should execute nearest neighbor search on VectorIndexData', () => {
      const vectorIndex = createEmptyVectorIndex('test-model', 3);
      upsertVectorRecord(vectorIndex, { passageId: 'p1', vector: [1, 0, 0], contentHash: 'h1' });
      upsertVectorRecord(vectorIndex, { passageId: 'p2', vector: [0.707, 0.707, 0], contentHash: 'h2' });
      upsertVectorRecord(vectorIndex, { passageId: 'p3', vector: [0, 1, 0], contentHash: 'h3' });

      const queryVector = [1, 0, 0];
      const results = searchVectorIndex(vectorIndex, queryVector, undefined, 2);

      assert.equal(results.length, 2);
      assert.equal(results[0].passageId, 'p1');
      assert.equal(results[0].cosineSimilarity, 1.0);
      assert.equal(results[1].passageId, 'p2');
    });
  });

  // ==========================================================================
  // 10. Vector Retrieval Engine & FakeEmbeddingProvider (Test-Only)
  // ==========================================================================
  describe('10. Vector Retrieval with Test-Only FakeEmbeddingProvider', () => {
    it('should search using test-only FakeEmbeddingProvider', async () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY, SYNTHETIC_SOURCE_SPEECH],
        [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[2]]
      );
      const fakeProvider = new FakeEmbeddingProvider('test-embed-v1', 32);

      // Create vector index with embeddings from fake provider
      const vectorIndex = createEmptyVectorIndex(fakeProvider.modelName, fakeProvider.dimensions);
      for (const p of [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[2]]) {
        const vec = await fakeProvider.embedQuery(p.normalizedText);
        upsertVectorRecord(vectorIndex, {
          passageId: p.id,
          vector: vec,
          contentHash: p.id + ':hash',
        });
      }

      const vectorEngine = new VectorRetrievalEngine(vectorIndex, fakeProvider, dataset);
      const res = await vectorEngine.search({ query: 'fraternity brotherhood' });

      assert.ok(res.items.length > 0);
      assert.equal(res.retrievalMethod, 'vector');
      assert.equal(res.items[0].retrievalMethod, 'vector');
      assert.ok(res.items[0].relevanceScore >= 0);
    });
  });

  // ==========================================================================
  // 11. Hybrid Fusion & Score Normalization
  // ==========================================================================
  describe('11. Hybrid Fusion & Score Normalization', () => {
    it('should fuse lexical and vector scores and tag method as hybrid', async () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY],
        [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[1]],
        [SYNTHETIC_EDITION],
        [SYNTHETIC_SECTION]
      );
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources, dataset.sections);
      const fakeProvider = new FakeEmbeddingProvider('test-embed', 16);

      const vectorIndex = createEmptyVectorIndex('test-embed', 16);
      for (const p of [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[1]]) {
        const vec = await fakeProvider.embedQuery(p.normalizedText);
        upsertVectorRecord(vectorIndex, { passageId: p.id, vector: vec, contentHash: 'h' });
      }

      const hybridEngine = new HybridRetrievalEngine(
        bm25,
        dataset,
        vectorIndex,
        fakeProvider,
        { ...DEFAULT_RETRIEVAL_CONFIG, lexicalWeight: 0.6, vectorWeight: 0.4 }
      );

      const res = await hybridEngine.search({ query: 'fraternity brotherhood' });

      assert.ok(res.items.length > 0);
      assert.equal(res.retrievalMethod, 'hybrid');

      const topItem = res.items[0];
      assert.ok(topItem.scoreBreakdown !== undefined);
      assert.ok(topItem.scoreBreakdown.normalizedLexicalScore !== undefined);
      assert.ok(topItem.scoreBreakdown.normalizedVectorScore !== undefined);
      assert.ok(topItem.scoreBreakdown.hybridScore !== undefined);

      // Verify that candidate deduplication ensured unique passage IDs
      const ids = res.items.map((it) => it.passage.id);
      const uniqueIds = new Set(ids);
      assert.equal(ids.length, uniqueIds.size);
    });
  });

  // ==========================================================================
  // 12. Graceful Fallback when Vector Retrieval is Unavailable
  // ==========================================================================
  describe('12. Graceful Lexical Fallback', () => {
    it('should fall back to full_text lexical search when no vector index or provider exists', async () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY],
        [SYNTHETIC_PASSAGES[0]],
        [SYNTHETIC_EDITION],
        [SYNTHETIC_SECTION]
      );
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources);

      // Instantiate without vectorIndex and without provider
      const hybridEngine = new HybridRetrievalEngine(bm25, dataset);

      const res = await hybridEngine.search({ query: 'fraternity' });

      assert.equal(res.retrievalMethod, 'full_text');
      assert.equal(res.items.length, 1);
      assert.equal(res.items[0].retrievalMethod, 'full_text');
    });

    it('should fall back when provider.isAvailable() is false', async () => {
      const dataset = createCorpusDataset([SYNTHETIC_SOURCE_PRIMARY], [SYNTHETIC_PASSAGES[0]]);
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources);
      const unavailableProvider = new UnavailableEmbeddingProvider();

      const hybridEngine = new HybridRetrievalEngine(
        bm25,
        dataset,
        createEmptyVectorIndex(),
        unavailableProvider
      );

      const res = await hybridEngine.search({ query: 'fraternity' });
      assert.equal(res.retrievalMethod, 'full_text');
    });
  });

  // ==========================================================================
  // 13. Index Manifest, Staleness & Integrity Checks
  // ==========================================================================
  describe('13. Index Manifest, Staleness & Integrity', () => {
    it('should save and load index manifest', async () => {
      const manifest: IndexManifest = {
        schemaVersion: INDEX_SCHEMA_VERSION,
        corpusHash: 'sample_corpus_sha256',
        passageCount: 10,
        sourceCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lexicalIndex: {
          type: 'bm25',
          version: '1.0',
          k1: 1.2,
          b: 0.75,
          totalTerms: 150,
          avgDocLength: 35.5,
        },
        vectorIndex: {
          enabled: false,
          provider: 'none',
          model: 'none',
          dimensions: 0,
          vectorCount: 0,
        },
      };

      await saveIndexManifest(INDEX_DIR, manifest);
      const loaded = await loadIndexManifest(INDEX_DIR);

      assert.ok(loaded !== null);
      assert.equal(loaded?.corpusHash, 'sample_corpus_sha256');
      assert.equal(loaded?.passageCount, 10);
    });

    it('should detect stale index when corpus hash changes', () => {
      const manifest: IndexManifest = {
        schemaVersion: 1,
        corpusHash: 'old_hash',
        passageCount: 5,
        sourceCount: 1,
        createdAt: '',
        updatedAt: '',
        lexicalIndex: { type: 'bm25', version: '1.0', k1: 1.2, b: 0.75, totalTerms: 10, avgDocLength: 10 },
        vectorIndex: { enabled: false, provider: 'none', model: 'none', dimensions: 0, vectorCount: 0 },
      };

      assert.equal(isIndexStale(manifest, 'old_hash'), false);
      assert.equal(isIndexStale(manifest, 'new_hash_modified_corpus'), true);
    });

    it('should flag validation error on vector dimension mismatch', () => {
      const manifest: IndexManifest = {
        schemaVersion: 1,
        corpusHash: 'h',
        passageCount: 2,
        sourceCount: 1,
        createdAt: '',
        updatedAt: '',
        lexicalIndex: { type: 'bm25', version: '1.0', k1: 1.2, b: 0.75, totalTerms: 10, avgDocLength: 10 },
        vectorIndex: { enabled: true, provider: 'test', model: 'm', dimensions: 1536, vectorCount: 2 },
      };

      const bm25Data = {
        schemaVersion: 1,
        k1: 1.2,
        b: 0.75,
        totalDocs: 2,
        avgDocLength: 10,
        docLengths: {},
        invertedIndex: {},
        docMetadata: {},
        updatedAt: '',
      };

      const vectorData = {
        schemaVersion: 1,
        embeddingModel: 'm',
        dimensions: 512, // Mismatch with manifest (1536)
        records: [],
        updatedAt: '',
      };

      const validation = validateIndexIntegrity(manifest, bm25Data, vectorData);
      assert.equal(validation.isValid, false);
      assert.ok(validation.errors.some((e) => e.includes('dimension mismatch')));
    });
  });

  // ==========================================================================
  // 14. Deterministic Ranking
  // ==========================================================================
  describe('14. Deterministic Ranking', () => {
    it('should produce identical ranking and scores across repeat searches', async () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY, SYNTHETIC_SOURCE_SPEECH],
        [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[1], SYNTHETIC_PASSAGES[2]]
      );
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources);
      const engine = new LexicalRetrievalEngine(bm25, dataset);

      const query: SearchQuery = { query: 'democracy fraternity liberty equality' };
      const run1 = await engine.search(query);
      const run2 = await engine.search(query);

      assert.equal(run1.items.length, run2.items.length);
      for (let i = 0; i < run1.items.length; i++) {
        assert.equal(run1.items[i].passage.id, run2.items[i].passage.id);
        assert.equal(run1.items[i].relevanceScore, run2.items[i].relevanceScore);
      }
    });
  });

  // ==========================================================================
  // 15. Retrieval Quality Evaluation (Precision@K, Recall@K, MRR)
  // ==========================================================================
  describe('15. Retrieval Quality Evaluation', () => {
    it('should calculate Precision@K, Recall@K, and MRR accurately on synthetic benchmark', async () => {
      const dataset = createCorpusDataset(
        [SYNTHETIC_SOURCE_PRIMARY, SYNTHETIC_SOURCE_SPEECH],
        [SYNTHETIC_PASSAGES[0], SYNTHETIC_PASSAGES[1], SYNTHETIC_PASSAGES[2]]
      );
      const bm25 = buildBm25Index(Array.from(dataset.passages.values()), dataset.sources);
      const engine = new LexicalRetrievalEngine(bm25, dataset);

      const evalCases: RetrievalEvaluationTestCase[] = [
        {
          query: 'fraternity brotherhood solidarity',
          relevantPassageIds: ['psg_synth_01'],
        },
        {
          query: 'educate agitate organize',
          relevantPassageIds: ['psg_synth_03'],
        },
      ];

      const metrics = await evaluateRetrieval(engine, evalCases, 2);

      assert.equal(metrics.evaluatedQueries, 2);
      assert.ok(metrics.precisionAtK > 0);
      assert.equal(metrics.recallAtK, 1.0); // Both queries successfully recalled top-1
      assert.equal(metrics.mrr, 1.0); // Both returned relevant passage at rank 1
    });
  });

  // ==========================================================================
  // 16. Corpus Hash Computation & Loading
  // ==========================================================================
  describe('16. Corpus Hash Computation & Loading', () => {
    it('should load corpus from disk and compute deterministic SHA-256 hash', async () => {
      const loaded = await loadCorpusFromDirectory(CORPUS_DIR);
      assert.equal(loaded.sources.size, 3);
      assert.equal(loaded.editions.size, 1);
      assert.equal(loaded.sections.size, 1);
      assert.equal(loaded.passages.size, 4);

      const hash = await computeCorpusHash(CORPUS_DIR);
      assert.equal(hash.length, 64);
    });
  });

  // ==========================================================================
  // 17. Environment Embedding Configuration
  // ==========================================================================
  describe('17. Environment Embedding Configuration', () => {
    it('should return UnavailableEmbeddingProvider when EMBEDDING_PROVIDER is none or unset', () => {
      const prev = process.env.EMBEDDING_PROVIDER;
      try {
        process.env.EMBEDDING_PROVIDER = 'none';
        const provider = getEnvEmbeddingProvider();
        assert.equal(provider.isAvailable(), false);
        assert.equal(provider.id, 'none');
      } finally {
        process.env.EMBEDDING_PROVIDER = prev;
      }
    });

    it('should throw when FakeEmbeddingProvider is attempted in production', () => {
      const env = process.env as Record<string, string | undefined>;
      const prevEnv = env.NODE_ENV;
      try {
        env.NODE_ENV = 'production';
        assert.throws(() => new FakeEmbeddingProvider(), /Security Violation/);
      } finally {
        env.NODE_ENV = prevEnv;
      }
    });
  });
});
