/**
 * Ask Ambedkar — Multilingual Tokenizer Abstraction
 * 
 * Provides deterministic, Unicode-aware tokenization supporting English, Marathi,
 * Hindi, and other Indic scripts without aggressive English-only stemming.
 */

export interface Tokenizer {
  /** Tokenizes raw text into an array of normalized token strings */
  tokenize(text: string): string[];
}

/**
 * Standard Unicode-aware tokenizer.
 * 
 * Strategy:
 * 1. Normalize Unicode characters to NFKC (standard compatibility form).
 * 2. Case-fold via toLowerCase().
 * 3. Match words using Unicode letter and number classes: \p{L}\p{N}, preserving
 *    internal hyphens (e.g. "jat-pat-todak") and apostrophes (e.g. "people's").
 * 4. Filter empty or single-character punctuation artifacts while preserving single-letter
 *    initials if alphanumeric.
 */
export class DefaultTokenizer implements Tokenizer {
  // Matches Unicode alphanumeric tokens and combining marks (\p{L}\p{M}\p{N}) with optional embedded hyphens/apostrophes
  private static readonly WORD_PATTERN = /[\p{L}\p{M}\p{N}]+(?:['’\-][\p{L}\p{M}\p{N}]+)*/gu;

  tokenize(text: string): string[] {
    if (!text) return [];

    const normalized = text.normalize('NFKC').toLowerCase();
    const matches = normalized.match(DefaultTokenizer.WORD_PATTERN);

    if (!matches) return [];

    return matches.map((token) => token.trim()).filter((token) => token.length > 0);
  }
}

export const defaultTokenizer = new DefaultTokenizer();
