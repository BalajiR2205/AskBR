'use client';

import React, { useState, useCallback } from 'react';
import { ChatMessage } from './types';
import { ChatHeader } from './ChatHeader';
import { ChatEmptyState } from './ChatEmptyState';
import { MessageList } from './MessageList';
import { ChatComposer } from './ChatComposer';
import { EvidenceViewer } from './EvidenceViewer';
import { getMockChatResponse, MOCK_EVIDENCE_STORE, MockEvidence } from '@/mock/chatData';

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  // Evidence Viewer state
  const [activeEvidence, setActiveEvidence] = useState<MockEvidence | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  const handleSubmit = useCallback(async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;

    const trimmed = questionText.trim();
    setLastQuestion(trimmed);
    setError(null);
    setInput('');

    // 1. Add User message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 2. Fetch mock response (simulates retrieval and generation)
      const mockResult = await getMockChatResponse(trimmed);

      // 3. Add Assistant response
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: mockResult.answer,
        timestamp: new Date().toISOString(),
        sourceSummary: mockResult.sourceSummary,
        sources: mockResult.sources,
        evidence: mockResult.evidence,
        status: mockResult.status,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Mock retrieval error:', err);
      setError("Failed to retrieve or evaluate sources for this question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setInput('');
    setIsEvidenceOpen(false);
    setActiveEvidence(null);
    setLastQuestion(null);
  }, []);

  const handleViewEvidence = useCallback((evidenceId: string) => {
    // Check in the evidence store
    const evidenceItem = MOCK_EVIDENCE_STORE[evidenceId];
    if (evidenceItem) {
      setActiveEvidence(evidenceItem);
      setIsEvidenceOpen(true);
      return;
    }

    // Fallback: check across loaded message evidence objects
    for (const msg of messages) {
      if (msg.evidence && msg.evidence[evidenceId]) {
        setActiveEvidence(msg.evidence[evidenceId]);
        setIsEvidenceOpen(true);
        return;
      }
    }
  }, [messages]);

  const handleCloseEvidence = useCallback(() => {
    setIsEvidenceOpen(false);
    setActiveEvidence(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (lastQuestion) {
      handleSubmit(lastQuestion);
    }
  }, [lastQuestion, handleSubmit]);

  const hasMessages = messages.length > 0;

  return (
    <div className="chat-interface-root">
      <ChatHeader onNewChat={handleNewChat} hasMessages={hasMessages} />

      <main className="chat-main-viewport">
        {!hasMessages ? (
          <div className="chat-empty-state-wrapper">
            <ChatEmptyState
              onSelectQuestion={handleSubmit}
              disabled={isLoading}
            />
          </div>
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
            onViewEvidence={handleViewEvidence}
          />
        )}
      </main>

      <ChatComposer
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isFollowUp={hasMessages}
      />

      {/* Accessible Evidence Drawer / Modal */}
      <EvidenceViewer
        evidence={activeEvidence}
        isOpen={isEvidenceOpen}
        onClose={handleCloseEvidence}
      />
    </div>
  );
}
