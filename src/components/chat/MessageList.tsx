'use client';

import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './types';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewEvidence: (evidenceId: string) => void;
}

export function MessageList({
  messages,
  isLoading,
  error,
  onRetry,
  onViewEvidence,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  return (
    <div className="chat-messages-scroll-area" role="log" aria-label="Conversation history" aria-live="polite">
      <div className="chat-messages-inner">
        {messages.map((message) => {
          if (message.role === 'user') {
            return <UserMessage key={message.id} message={message} />;
          }
          return (
            <AssistantMessage
              key={message.id}
              message={message}
              onViewEvidence={onViewEvidence}
            />
          );
        })}

        {isLoading && <LoadingState />}

        {error && <ErrorState message={error} onRetry={onRetry} />}

        <div ref={bottomRef} tabIndex={-1} aria-hidden="true" style={{ height: '1px' }} />
      </div>
    </div>
  );
}
