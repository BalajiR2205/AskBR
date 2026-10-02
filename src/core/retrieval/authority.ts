/**
 * Ask Ambedkar — Source Authority Evaluation
 * 
 * Central authoritative source predicate.
 * Enforces Ask Ambedkar Core Invariant: Only authentic primary works authored or
 * delivered by Dr. B. R. Ambedkar with VERIFIED or PUBLISHED status are eligible
 * for authoritative evidence retrieval.
 */

import { Source } from '../sources/types';

/**
 * Checks if a source satisfies the strict authority invariants for Ask Ambedkar evidence.
 * 
 * Rules:
 * 1. Must have PRIMARY classification (no secondary commentaries or modern interpretations).
 * 2. Status must be VERIFIED or PUBLISHED (no DRAFT or ARCHIVED material unless explicitly queried).
 * 3. Author / Speaker attribution must be 'Dr. B. R. Ambedkar'.
 */
export function isAuthoritativeSource(source: Source): boolean {
  if (!source) return false;

  // 1. Classification must be strictly PRIMARY
  if (source.classification !== 'PRIMARY') {
    return false;
  }

  // 2. Status must be VERIFIED or PUBLISHED
  if (source.status !== 'VERIFIED' && source.status !== 'PUBLISHED') {
    return false;
  }

  // 3. Attribution must be authentic Dr. B. R. Ambedkar
  const authorName = source.attribution?.name?.trim();
  if (authorName !== 'Dr. B. R. Ambedkar') {
    return false;
  }

  return true;
}
