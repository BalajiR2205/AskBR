/**
 * Ask Ambedkar — Primary Source Architecture: Passage Validation
 * 
 * Enforces Passage Integrity Rules:
 * 1. Original text is non-empty and preserved verbatim.
 * 2. Stable IDs and source references are mandatory.
 * 3. Translations are strictly segregated from original text.
 */

import { Passage, TranslationType } from './types';

export interface PassageValidationResult {
  isValid: boolean;
  errors: string[];
}

export const VALID_TRANSLATION_TYPES: TranslationType[] = [
  'ORIGINAL',
  'PUBLISHED_TRANSLATION',
  'GENERATED_TRANSLATION',
];

export function validatePassage(passage: Partial<Passage>): PassageValidationResult {
  const errors: string[] = [];

  // 1. Stable ID
  if (!passage.id || typeof passage.id !== 'string' || passage.id.trim().length === 0) {
    errors.push('Passage must have a non-empty stable ID.');
  }

  // 2. Parent Source Reference
  if (!passage.sourceId || typeof passage.sourceId !== 'string' || passage.sourceId.trim().length === 0) {
    errors.push('Passage must reference a valid sourceId.');
  }

  // 3. Sequence
  if (typeof passage.sequence !== 'number' || passage.sequence < 1) {
    errors.push('Passage sequence must be a positive integer (>= 1).');
  }

  // 4. Verbatim Original Text (Rule 1: Original text is immutable and mandatory)
  if (!passage.originalText || typeof passage.originalText !== 'string' || passage.originalText.trim().length === 0) {
    errors.push('Passage must contain non-empty originalText.');
  }

  // 5. Language
  if (!passage.language || passage.language.trim().length === 0) {
    errors.push('Passage must specify a language code.');
  }

  // 6. Translation Architecture Constraints (Rule 3: Translation distinction)
  if (!passage.translationMetadata) {
    errors.push('Passage must include translationMetadata.');
  } else {
    const tm = passage.translationMetadata;
    if (!VALID_TRANSLATION_TYPES.includes(tm.translationType)) {
      errors.push(`Invalid translationType: "${tm.translationType}". Must be ORIGINAL, PUBLISHED_TRANSLATION, or GENERATED_TRANSLATION.`);
    }

    if (tm.isOriginal && tm.translationType !== 'ORIGINAL') {
      errors.push('Passage marked isOriginal: true must have translationType: "ORIGINAL".');
    }

    if (!tm.isOriginal && tm.translationType === 'ORIGINAL') {
      errors.push('Passage marked isOriginal: false cannot have translationType: "ORIGINAL".');
    }

    if (!tm.isOriginal && !tm.originalPassageId) {
      errors.push('Translated passage must specify the originalPassageId it translates.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
