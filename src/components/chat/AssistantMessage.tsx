'use client';

import React from 'react';
import { ChatMessage } from './types';
import { AnswerContent } from './AnswerContent';
import { SourceList } from './SourceList';

interface AssistantMessageProps {
  message: ChatMessage;
  onViewEvidence: (evidenceId: string) => void;
}

export function AssistantMessage({ message, onViewEvidence }: AssistantMessageProps) {
  return (
    <article className="assistant-message-row" aria-label="Ask Ambedkar response">
      <div className="assistant-avatar" aria-hidden="true">
        <span>अ</span>
      </div>

      <div className="assistant-message-body">
        <div className="assistant-header-meta">
          <span className="assistant-label">Ask Ambedkar</span>
          <span className="assistant-tagline">Primary-Source Documented View</span>
        </div>

        <div className="assistant-card">
          <AnswerContent content={message.content} status={message.status} />

          <SourceList
            sourceSummary={message.sourceSummary}
            sources={message.sources}
            onViewEvidence={onViewEvidence}
          />
        </div>
      </div>
    </article>
  );
}
