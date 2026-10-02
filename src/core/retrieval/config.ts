/**
 * Ask Ambedkar — Retrieval Configuration & Defaults
 * 
 * Centralizes all retrieval hyperparameters, scoring weights, and search defaults.
 * Avoids magic numbers scattered across the codebase.
 */

export interface RetrievalFieldWeights {
  /** Primary search weight for passage content text (default: 1.0) */
  text: number;

  /** Weight boost if query terms appear in the chapter title (default: 0.2) */
  chapter: number;

  /** Weight boost if query terms appear in the section title (default: 0.2) */
  section: number;

  /** Weight boost if query terms appear in the parent source title (default: 0.1) */
  title: number;
}

export interface RetrievalConfig {
  /** BM25 term frequency saturation parameter (k1) (typical: 1.2 - 2.0) */
  bm25K1: number;

  /** BM25 document length normalization parameter (b) (typical: 0.75) */
  bm25B: number;

  /** Relative weight of lexical BM25 score in hybrid fusion (default: 0.5) */
  lexicalWeight: number;

  /** Relative weight of vector cosine similarity in hybrid fusion (default: 0.5) */
  vectorWeight: number;

  /** Default number of top results to return if not specified in SearchQuery */
  defaultTopK: number;

  /**
   * Multiplier used to retrieve a larger candidate pool before hybrid fusion.
   * Pool size = topK * candidateMultiplier (default: 4 -> top 20 candidates for topK=5).
   */
  candidateMultiplier: number;

  /** Additive or multiplicative boost for exact multi-term phrase matches (default: 1.5) */
  exactPhraseBoost: number;

  /** Field weighting configuration */
  fieldWeights: RetrievalFieldWeights;
}

export const DEFAULT_RETRIEVAL_CONFIG: RetrievalConfig = {
  bm25K1: 1.2,
  bm25B: 0.75,
  lexicalWeight: 0.5,
  vectorWeight: 0.5,
  defaultTopK: 5,
  candidateMultiplier: 4,
  exactPhraseBoost: 1.5,
  fieldWeights: {
    text: 1.0,
    chapter: 0.2,
    section: 0.2,
    title: 0.1,
  },
};
