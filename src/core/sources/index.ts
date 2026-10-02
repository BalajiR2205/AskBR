/**
 * Primary Sources Domain Module
 * 
 * Segment 0 Foundation: Interface boundaries and provenance verification.
 * Does NOT contain fake data or mock knowledge bases.
 */

export * from './types';

import { PrimarySourceType, SourceProvenance } from './types';

/**
 * Validates whether a candidate source belongs strictly to the permitted
 * primary source categories attributable to Dr. B. R. Ambedkar.
 */
export function isPermittedSourceCategory(category: string): category is PrimarySourceType {
  const permittedCategories: PrimarySourceType[] = [
    'book',
    'speech',
    'interview',
    'constituent_assembly_debate',
    'letter',
    'article_editorial',
  ];
  return permittedCategories.includes(category as PrimarySourceType);
}

/**
 * Validates that provenance metadata meets the mandatory attribution standards.
 */
export function validateProvenance(provenance: SourceProvenance): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!provenance.workTitle?.trim()) {
    errors.push('Provenance must include a work or collection title.');
  }

  if (provenance.author !== 'B. R. Ambedkar') {
    errors.push('Author must be strictly B. R. Ambedkar (primary sources only).');
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
