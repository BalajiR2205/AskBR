/**
 * Chat Orchestration Domain Module
 * 
 * Segment 0 Foundation: Wires the conceptual pipeline cleanly.
 */

export * from './types';

import { ChatOrchestrator, ChatRequest, ChatResponse } from './types';
import { basicQuestionAnalysis } from '../question_processing';
import { defaultRetrievalEngine } from '../retrieval';
import { defaultEvidenceEvaluator } from '../evidence';
import { createInsufficientEvidenceResponse } from '../answers';

export class PipelineChatOrchestrator implements ChatOrchestrator {
  async handleQuestion(request: ChatRequest): Promise<ChatResponse> {
    // 1. Question Processing
    const processedQuestion = basicQuestionAnalysis(request.question);

    // If query is anachronistic or modern speculation, immediately return documented refusal
    if (processedQuestion.isModernSpeculationQuestion) {
      const answer = createInsufficientEvidenceResponse(request.question, true);
      return {
        answer,
        processedQuestion,
        retrievalMetadata: { totalFound: 0, executionTimeMs: 0 },
        evidenceSummary: {
          category: 'insufficient_evidence',
          hasSufficientEvidence: false,
          confidenceScore: 0,
        },
      };
    }

    // 2. Retrieval Layer
    const retrievalResult = await defaultRetrievalEngine.retrieve({
      queryText: processedQuestion.normalizedText,
    });

    // 3. Evidence Evaluation
    const evidenceEvaluation = await defaultEvidenceEvaluator.evaluate(
      retrievalResult.passages,
      processedQuestion.normalizedText
    );

    // 4. Answer Generation (Segment 0: Knowledge base indexing occurs in later segments)
    const answer = createInsufficientEvidenceResponse(request.question, false);

    return {
      answer,
      processedQuestion,
      retrievalMetadata: {
        totalFound: retrievalResult.totalFound,
        executionTimeMs: retrievalResult.executionTimeMs,
      },
      evidenceSummary: {
        category: evidenceEvaluation.category,
        hasSufficientEvidence: evidenceEvaluation.hasSufficientEvidence,
        confidenceScore: evidenceEvaluation.confidenceScore,
      },
    };
  }
}

export const defaultChatOrchestrator = new PipelineChatOrchestrator();
