/**
 * Evidence Selection & Evaluation Domain Module — Types
 * 
 * Segment 3: Future Evidence Contract
 * Creates an authoritative evidence structure for answer synthesis.
 * The answer engine consumes evidence without mixing generated text into the source model.
 */

import { ScoredPassage } from '../retrieval/types';
import { Source, SourceProvenance } from '../sources/types';
import { Passage } from '../passages/types';
import { ProvenanceRecord } from '../provenance/types';

export type EvidenceCategory =
  | 'directly_documented'
  | 'multiple_passages'
  | 'insufficient_evidence';

// ============================================================================
// 1. Future Canonical Evidence Contract (Segment 3)
// ============================================================================

export interface EvidenceItem {
  /** Reference to atomic passage entity */
  passage: Passage;

  /** Reference to parent source entity */
  source: Source;

  /** Complete provenance record */
  provenance: ProvenanceRecord;

  /** Formatted academic citation string */
  citation: string;

  /** Relevance / confidence score (0.0 to 1.0) */
  relevanceScore: number;

  /** Verbatim excerpt text directly attributable to Ambedkar */
  verbatimExcerpt: string;
}

export interface EvidencePackage {
  /** The original user question */
  query: string;

  /** Evidence category determined by evidence evaluation */
  category: EvidenceCategory;

  /** True if evidence meets the sufficiency threshold to formulate a position */
  hasSufficientEvidence: boolean;

  /** Overall confidence score of the selected evidence set */
  confidenceScore: number;

  /** Supporting evidence items with strict provenance */
  evidenceItems: EvidenceItem[];

  /** Optional evaluation reasoning or insufficiency explanation */
  reasoning?: string;
}

// ============================================================================
// 2. Compatibility Evidence Types
// ============================================================================

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
