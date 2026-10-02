/**
 * Ask Ambedkar — BM25 Lexical Index & Scoring Engine
 * 
 * Implements standard Robertson-Spärck Jones BM25 with term frequency,
 * document length normalization, field weighting, exact phrase boosting,
 * and snippet match highlight extraction.
 */

import { DocumentSection, Source } from '../sources/types';
import { Passage } from '../passages/types';
import { DEFAULT_RETRIEVAL_CONFIG, RetrievalConfig } from './config';
import { DefaultTokenizer, Tokenizer } from './tokenizer';
import { Bm25IndexData, DocumentLexicalMetadata, PostingItem } from './types';

export interface ScoredLexicalResult {
  docId: string;
  rawScore: number;
  normalizedScore: number;
  exactPhraseBonus: number;
  matchHighlights?: string[];
}

/**
 * Builds an in-memory BM25 index from passages, sources, and document sections.
 */
export function buildBm25Index(
  passages: Passage[],
  sources: Map<string, Source>,
  sections: Map<string, DocumentSection> = new Map(),
  config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG,
  tokenizer: Tokenizer = new DefaultTokenizer()
): Bm25IndexData {
  const invertedIndex: Record<string, PostingItem[]> = {};
  const docLengths: Record<string, number> = {};
  const docMetadata: Record<string, DocumentLexicalMetadata> = {};

  let totalDocLength = 0;

  for (const passage of passages) {
    const source = sources.get(passage.sourceId);
    const sourceTitle = source?.title || '';
    const section = passage.parentSectionId ? sections.get(passage.parentSectionId) : undefined;
    const chapterTitle = passage.chapter || (section?.level === 'CHAPTER' ? section.title : '');
    const sectionTitle = passage.section || section?.title || '';

    // Tokenize fields
    const textTokens = tokenizer.tokenize(passage.normalizedText || passage.originalText);
    const chapterTokens = tokenizer.tokenize(chapterTitle);
    const sectionTokens = tokenizer.tokenize(sectionTitle);
    const titleTokens = tokenizer.tokenize(sourceTitle);

    // Document length based primarily on passage text
    const docLength = Math.max(1, textTokens.length);
    docLengths[passage.id] = docLength;
    totalDocLength += docLength;

    // Count weighted term frequencies
    const termFreqMap = new Map<string, number>();

    // 1. Passage text (primary weight)
    for (const token of textTokens) {
      termFreqMap.set(token, (termFreqMap.get(token) || 0) + config.fieldWeights.text);
    }

    // 2. Chapter title boost
    for (const token of chapterTokens) {
      termFreqMap.set(token, (termFreqMap.get(token) || 0) + config.fieldWeights.chapter);
    }

    // 3. Section title boost
    for (const token of sectionTokens) {
      termFreqMap.set(token, (termFreqMap.get(token) || 0) + config.fieldWeights.section);
    }

    // 4. Source title boost
    for (const token of titleTokens) {
      termFreqMap.set(token, (termFreqMap.get(token) || 0) + config.fieldWeights.title);
    }

    // Populate inverted index postings
    for (const [term, freq] of termFreqMap.entries()) {
      if (!invertedIndex[term]) {
        invertedIndex[term] = [];
      }
      invertedIndex[term].push({
        docId: passage.id,
        termFreq: Number(freq.toFixed(2)),
      });
    }

    // Metadata for filtering & change detection
    docMetadata[passage.id] = {
      passageId: passage.id,
      sourceId: passage.sourceId,
      editionId: passage.editionId,
      sectionId: passage.parentSectionId,
      chapter: chapterTitle || undefined,
      section: sectionTitle || undefined,
      sourceTitle,
      contentHash: passage.id + ':' + (passage.normalizedText || passage.originalText).length,
    };
  }

  const totalDocs = passages.length;
  const avgDocLength = totalDocs > 0 ? totalDocLength / totalDocs : 1;

  return {
    schemaVersion: 1,
    k1: config.bm25K1,
    b: config.bm25B,
    totalDocs,
    avgDocLength,
    docLengths,
    invertedIndex,
    docMetadata,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Scores documents against a search query using the BM25 index.
 */
export function scoreBm25(
  index: Bm25IndexData,
  queryTerms: string[],
  rawQueryString: string,
  passagesMap: Map<string, Passage>,
  filterDocIds?: Set<string>,
  config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG
): ScoredLexicalResult[] {
  if (queryTerms.length === 0 || index.totalDocs === 0) {
    return [];
  }

  const { k1, b, totalDocs, avgDocLength, docLengths, invertedIndex } = index;
  const docScores = new Map<string, number>();

  // Check for exact phrase in query (enclosed in quotes or multi-word)
  const cleanQueryPhrase = rawQueryString.replace(/["']/g, '').trim().toLowerCase();
  const isExactPhraseQuery = rawQueryString.includes('"') || queryTerms.length >= 2;

  // Process each query term
  for (const term of queryTerms) {
    const postings = invertedIndex[term];
    if (!postings || postings.length === 0) continue;

    // Document frequency n(q)
    const n = postings.length;

    // Standard Robertson-Spärck Jones IDF with smoothing
    const idf = Math.log(1 + (totalDocs - n + 0.5) / (n + 0.5));

    for (const posting of postings) {
      const { docId, termFreq } = posting;

      // Honor pre-filtered candidate subset
      if (filterDocIds && !filterDocIds.has(docId)) {
        continue;
      }

      const docLength = docLengths[docId] || avgDocLength;

      // BM25 term saturation formula:
      // (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength)))
      const denom = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
      const termScore = idf * ((termFreq * (k1 + 1)) / denom);

      docScores.set(docId, (docScores.get(docId) || 0) + termScore);
    }
  }

  // Exact phrase check and bonus
  const scoredResults: ScoredLexicalResult[] = [];
  let maxScore = 0;
  let minScore = Infinity;

  for (const [docId, baseScore] of docScores.entries()) {
    let finalScore = baseScore;
    let exactPhraseBonus = 0;

    const passage = passagesMap.get(docId);
    if (passage && isExactPhraseQuery && cleanQueryPhrase.length > 3) {
      const normTextLower = (passage.normalizedText || passage.originalText).toLowerCase();
      if (normTextLower.includes(cleanQueryPhrase)) {
        exactPhraseBonus = config.exactPhraseBoost * (1 + cleanQueryPhrase.length / 50);
        finalScore += exactPhraseBonus;
      }
    }

    if (finalScore > maxScore) maxScore = finalScore;
    if (finalScore < minScore) minScore = finalScore;

    const highlights = passage
      ? generateMatchHighlights(passage.normalizedText || passage.originalText, queryTerms)
      : undefined;

    scoredResults.push({
      docId,
      rawScore: Number(finalScore.toFixed(4)),
      normalizedScore: 0, // Computed below
      exactPhraseBonus: Number(exactPhraseBonus.toFixed(4)),
      matchHighlights: highlights,
    });
  }

  // Min-Max normalization across lexical candidate set
  for (const res of scoredResults) {
    if (maxScore > minScore) {
      res.normalizedScore = Number(((res.rawScore - minScore) / (maxScore - minScore)).toFixed(4));
    } else {
      res.normalizedScore = res.rawScore > 0 ? 1.0 : 0.0;
    }
  }

  // Sort descending by raw score
  scoredResults.sort((a, b) => b.rawScore - a.rawScore);

  return scoredResults;
}

/**
 * Extracts a match highlight snippet with ellipsis around matching query terms.
 */
export function generateMatchHighlights(
  text: string,
  queryTerms: string[],
  maxLength = 180
): string[] {
  if (!text || queryTerms.length === 0) return [];

  const lowerText = text.toLowerCase();
  let firstMatchIdx = -1;

  for (const term of queryTerms) {
    const idx = lowerText.indexOf(term.toLowerCase());
    if (idx !== -1 && (firstMatchIdx === -1 || idx < firstMatchIdx)) {
      firstMatchIdx = idx;
    }
  }

  if (firstMatchIdx === -1) {
    return [text.slice(0, maxLength) + (text.length > maxLength ? '...' : '')];
  }

  const start = Math.max(0, firstMatchIdx - 40);
  const end = Math.min(text.length, firstMatchIdx + maxLength - 40);

  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return [snippet];
}
