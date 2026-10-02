/**
 * Answer Generation Domain Module
 * 
 * Segment 0 Foundation: Contract interfaces and standard non-speculation fallback logic.
 */

export * from './types';

import { AnswerCitation, AnswerResult, SelectedEvidenceItem } from './types';
import { EvidenceCategory } from '../evidence/types';

export const STANDARD_DISCLAIMER =
  'Answers are derived strictly from documented primary writings and recorded statements of Dr. B. R. Ambedkar. This system does not speculate or attribute undocumented opinions.';

export const INSUFFICIENT_EVIDENCE_TEMPLATE = (question: string) =>
  `The available primary sources and documented writings of Dr. B. R. Ambedkar do not contain sufficient evidence to establish a recorded position on "${question}". The system does not extrapolate or generate opinions beyond documented primary evidence.`;

export const MODERN_SPECULATION_TEMPLATE = (question: string) =>
  `The question "${question}" concerns a modern or post-historical subject. Dr. B. R. Ambedkar's documented writings and recorded statements contain no position on this subject. In accordance with our core principle, Ask Ambedkar does not speculate on what Ambedkar "would have thought."`;

/**
 * Builds standard citation objects from verified evidence items.
 */
export function buildCitations(evidenceItems: SelectedEvidenceItem[]): AnswerCitation[] {
  return evidenceItems.map(item => ({
    id: item.passageId,
    sourceTitle: item.provenance.workTitle,
    sourceType: item.provenance.sourceType,
    dateOrYear: item.provenance.dateOrYear,
    chapterOrSection: item.provenance.chapter || item.provenance.section,
    page: item.provenance.page,
    verbatimExcerpt: item.verbatimExcerpt,
    provenance: item.provenance,
  }));
}

/**
 * Factory for creating an explicit insufficient-evidence response.
 */
export function createInsufficientEvidenceResponse(question: string, isModernSpeculation = false): AnswerResult {
  return {
    question,
    answerText: isModernSpeculation
      ? MODERN_SPECULATION_TEMPLATE(question)
      : INSUFFICIENT_EVIDENCE_TEMPLATE(question),
    status: isModernSpeculation ? 'modern_speculation_refusal' : 'insufficient_evidence',
    evidenceCategory: 'insufficient_evidence' as EvidenceCategory,
    citations: [],
    disclaimer: STANDARD_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}
