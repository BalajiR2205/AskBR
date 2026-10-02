/**
 * Primary Sources Domain Module
 * 
 * Segment 3: Canonical Primary Source Architecture
 */

export * from './types';
export * from './validation';
export * from './repository';
export * from './fixtures';

import { PrimarySourceType, SourceCategory, SourceProvenance } from './types';
import { VALID_SOURCE_CATEGORIES } from './validation';

/**
 * Validates whether a candidate source belongs strictly to the permitted
 * primary source categories attributable to Dr. B. R. Ambedkar.
 */
export function isPermittedSourceCategory(category: string): category is PrimarySourceType {
  const upper = category.toUpperCase();
  if (VALID_SOURCE_CATEGORIES.includes(upper as SourceCategory)) return true;

  const legacyCategories: string[] = [
    'book',
    'speech',
    'interview',
    'constituent_assembly_debate',
    'letter',
    'article_editorial',
    'article',
    'editorial',
  ];
  return legacyCategories.includes(category.toLowerCase());
}

/**
 * Validates that provenance metadata meets the mandatory attribution standards.
 */
export function validateProvenance(provenance: SourceProvenance): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!provenance.workTitle?.trim()) {
    errors.push('Provenance must include a work or collection title.');
  }

  const authorLower = (provenance.author || '').toLowerCase();
  if (!authorLower.includes('ambedkar')) {
    errors.push('Author must be strictly Dr. B. R. Ambedkar (primary sources only).');
  }

  if (!isPermittedSourceCategory(provenance.sourceType)) {
    errors.push(`Invalid source category: ${provenance.sourceType}. Must be an approved primary source category.`);
  }

  if (!provenance.originalText?.trim()) {
    errors.push('Provenance must retain verbatim original text.');
  }

  if (!provenance.referenceInfo?.trim()) {
    errors.push('Provenance must include reference/bibliographic information.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
