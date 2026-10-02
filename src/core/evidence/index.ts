/**
 * Evidence Selection & Evaluation Domain Module
 * 
 * Segment 0 Foundation: Strict evidence categorization logic.
 */

export * from './types';

import { EvidenceEvaluation, EvidenceEvaluator } from './types';
import { ScoredPassage } from '../retrieval/types';

export class StrictEvidenceEvaluator implements EvidenceEvaluator {
  /**
   * Minimum confidence threshold to consider primary evidence sufficient.
   * If retrieved sources fall below this, system must refuse to speculate.
   */
  private readonly sufficiencyThreshold = 0.7;

  async evaluate(passages: ScoredPassage[], question?: string): Promise<EvidenceEvaluation> {
    void question; // Will be used in future segments for question-passage alignment
    if (!passages || passages.length === 0) {
      return {
        category: 'insufficient_evidence',
        hasSufficientEvidence: false,
        confidenceScore: 0,
        selectedPassages: [],
        evaluationReasoning: 'No documented primary sources found addressing this topic in the knowledge base.',
      };
    }

    const topPassage = passages[0];

    if (topPassage.score < this.sufficiencyThreshold) {
      return {
        category: 'insufficient_evidence',
        hasSufficientEvidence: false,
        confidenceScore: topPassage.score,
        selectedPassages: [],
        evaluationReasoning: 'Available primary passages do not meet the minimum confidence threshold to state a documented position.',
      };
    }

    const highConfidencePassages = passages.filter(p => p.score >= this.sufficiencyThreshold);

    if (highConfidencePassages.length === 1) {
      return {
        category: 'directly_documented',
        hasSufficientEvidence: true,
        confidenceScore: topPassage.score,
        selectedPassages: highConfidencePassages.map(p => ({
          passageId: p.passage.id,
          verbatimExcerpt: p.passage.content,
          relevanceScore: p.score,
          provenance: p.passage.provenance,
        })),
        evaluationReasoning: 'Supported by a direct documented statement in primary source.',
      };
    }

    return {
      category: 'multiple_passages',
      hasSufficientEvidence: true,
      confidenceScore: topPassage.score,
      selectedPassages: highConfidencePassages.map(p => ({
        passageId: p.passage.id,
        verbatimExcerpt: p.passage.content,
        relevanceScore: p.score,
        provenance: p.passage.provenance,
      })),
      evaluationReasoning: 'Synthesized across multiple verified primary source passages.',
    };
  }
}

export const defaultEvidenceEvaluator = new StrictEvidenceEvaluator();
