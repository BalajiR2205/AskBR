/**
 * Question Processing Domain Module
 * 
 * Segment 0 Foundation: Sanitization and contract verification.
 */

export * from './types';

import { ProcessedQuestion } from './types';

/**
 * Basic question normalizer and validator for Segment 0 foundation.
 */
export function sanitizeQuestion(raw: string, maxLength = 500): string {
  if (!raw) return '';
  return raw
    .trim()
    .slice(0, maxLength)
    .replace(/\s+/g, ' ');
}

/**
 * Foundation heuristic for question processing before full NLP integration.
 */
export function basicQuestionAnalysis(raw: string): ProcessedQuestion {
  const sanitized = sanitizeQuestion(raw);
  
  // Heuristic indicator for modern technological or anachronistic queries
  const modernTerms = ['artificial intelligence', 'ai', 'crypto', 'internet', 'social media', 'smartphone', 'blockchain'];
  const lower = sanitized.toLowerCase();
  const isModernSpeculation = modernTerms.some(term => lower.includes(term));

  return {
    normalizedText: sanitized,
    detectedLanguage: 'en', // Default fallback for Segment 0
    extractedKeywords: sanitized.split(' ').filter(word => word.length > 3),
    isSearchable: sanitized.length >= 3,
    isModernSpeculationQuestion: isModernSpeculation,
  };
}
