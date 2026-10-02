/**
 * Chat Orchestration Domain Module — Types
 * 
 * Coordinates the full decoupled pipeline:
 * Question Processing -> Retrieval -> Evidence Selection -> Answer Generation -> Citations
 */

import { AnswerResult } from '../answers/types';
import { ProcessedQuestion } from '../question_processing/types';

export interface ChatRequest {
  question: string;
  sessionId?: string;
  preferredLanguage?: string;
}

export interface ChatResponse {
  answer: AnswerResult;
  processedQuestion: ProcessedQuestion;
  retrievalMetadata: {
    totalFound: number;
    executionTimeMs: number;
  };
  evidenceSummary: {
    category: string;
    hasSufficientEvidence: boolean;
    confidenceScore: number;
  };
}

export interface ChatOrchestrator {
  handleQuestion(request: ChatRequest): Promise<ChatResponse>;
}
