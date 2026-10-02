/**
 * Answer Generation Domain Module — Types
 * 
 * Defines the contract for generating answers strictly anchored to primary sources.
 * 
 * Core Answer Principle:
 * "Never invent an opinion and attribute it to Ambedkar.
 * If the available primary sources do not contain sufficient evidence to establish
 * Ambedkar's documented position on a question, the system must explicitly say
 * that there is no sufficient documented evidence."
 */

import { EvidenceCategory, SelectedEvidenceItem } from '../evidence/types';
import { SourceProvenance } from '../sources/types';

export type { EvidenceCategory, SelectedEvidenceItem };

export interface AnswerCitation {
  id: string;
  sourceTitle: string;
  sourceType: string;
  dateOrYear?: string;
  chapterOrSection?: string;
  page?: string | number;
  verbatimExcerpt: string;
  provenance: SourceProvenance;
}

export type AnswerStatus =
  | 'sufficient_evidence'
  | 'insufficient_evidence'
  | 'modern_speculation_refusal';

export interface AnswerResult {
  question: string;
  answerText: string;
  status: AnswerStatus;
  evidenceCategory: EvidenceCategory;
  citations: AnswerCitation[];
  disclaimer: string;
  generatedAt: string;
}

export interface AnswerGenerator {
  generate(question: string, evidenceItems: SelectedEvidenceItem[]): Promise<AnswerResult>;
}
