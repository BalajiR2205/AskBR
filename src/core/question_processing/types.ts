/**
 * Question Processing Domain Module — Types
 * 
 * Defines contracts for sanitizing user queries, detecting language,
 * and assessing query suitability for Ambedkar primary source retrieval.
 */

export interface ProcessedQuestion {
  /** Cleaned and normalized query text */
  normalizedText: string;

  /** Detected ISO language code (e.g., 'en', 'hi', 'mr') */
  detectedLanguage: string;

  /** Identified query topics/keywords for hybrid retrieval */
  extractedKeywords: string[];

  /** Whether the query is suitable for historical primary source lookup */
  isSearchable: boolean;

  /** Flag if query asks for speculative modern opinions (e.g. "What would Ambedkar think of AI?") */
  isModernSpeculationQuestion: boolean;
}

export interface QuestionProcessor {
  process(rawQuestion: string): Promise<ProcessedQuestion>;
}
