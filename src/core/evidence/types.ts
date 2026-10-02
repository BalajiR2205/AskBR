/**
 * Evidence Selection & Evaluation Domain Module — Types
 * 
 * Implements the core answer principle:
 * Never invent an opinion and attribute it to Ambedkar.
 * 
 * Must rigorously distinguish between:
 * 1. Directly documented statements
 * 2. Conclusions supported by multiple documented passages
 * 3. Questions for which sufficient evidence does not exist
 */

import { ScoredPassage } from '../retrieval/types';
import { SourceProvenance } from '../sources/types';

export type EvidenceCategory =
  | 'directly_documented'
  | 'multiple_passages'
  | 'insufficient_evidence';

export interface SelectedEvidenceItem {
  passageId: string;
  verbatimExcerpt: string;
  relevanceScore: number;
  provenance: SourceProvenance;
}

export interface EvidenceEvaluation {
  category: EvidenceCategory;
  hasSufficientEvidence: boolean;
  confidenceScore: number; // 0.0 to 1.0
  selectedPassages: SelectedEvidenceItem[];
  evaluationReasoning?: string;
}

export interface EvidenceEvaluator {
  evaluate(passages: ScoredPassage[], question?: string): Promise<EvidenceEvaluation>;
}
