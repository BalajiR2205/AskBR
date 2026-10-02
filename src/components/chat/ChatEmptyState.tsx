'use client';

import React from 'react';
import { SUGGESTED_QUESTIONS } from '@/mock/chatData';
import { SuggestedQuestion } from './SuggestedQuestion';

interface ChatEmptyStateProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

export function ChatEmptyState({ onSelectQuestion, disabled }: ChatEmptyStateProps) {
  return (
    <div className="chat-empty-state" aria-label="Conversation starter">
      <div className="empty-state-badge">
        <span className="badge-dot" aria-hidden="true" />
        <span>Primary-Source Research System</span>
      </div>

      <h1 className="empty-state-title">Ask Ambedkar</h1>

      <p className="empty-state-tagline">“Ask anything. Discover what Ambedkar wrote.”</p>

      <p className="empty-state-description">
        Explore what B. R. Ambedkar wrote about society, democracy, equality, caste, law, economics, religion and more.
        Every eventual response will be anchored exclusively in his primary writings and recorded speeches.
      </p>

      <div className="empty-state-suggestions-section">
        <span className="suggestions-heading">EXPLORE KEY TOPICS (MOCK DATASET)</span>
        <div className="suggestions-list" role="list">
          {SUGGESTED_QUESTIONS.map((q) => (
            <div key={q} role="listitem">
              <SuggestedQuestion
                question={q}
                onClick={onSelectQuestion}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
