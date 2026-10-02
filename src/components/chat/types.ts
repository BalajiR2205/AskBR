/**
 * Types for Chat UI Components
 */

import { MockEvidence, MockSourceCardData } from '@/mock/chatData';

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  sourceSummary?: string;
  sources?: MockSourceCardData[];
  evidence?: Record<string, MockEvidence>;
  status?: 'sufficient_evidence' | 'insufficient_evidence' | 'error';
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  activeEvidence: MockEvidence | null;
}
