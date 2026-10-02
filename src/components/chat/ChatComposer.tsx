'use client';

import React, { useRef, useEffect } from 'react';

interface ChatComposerProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (question: string) => void;
  isLoading: boolean;
  isFollowUp?: boolean;
}

export function ChatComposer({
  input,
  setInput,
  onSubmit,
  isLoading,
  isFollowUp = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, 180);
    textarea.style.height = `${Math.max(48, nextHeight)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(input.trim());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
    }
  };

  const placeholderText = isFollowUp
    ? 'Ask a follow-up about Ambedkar’s writings...'
    : 'Ask what Ambedkar wrote about...';

  const isSubmitDisabled = !input.trim() || isLoading;

  return (
    <footer className="chat-composer-container" aria-label="Message composer">
      <form className="chat-composer-form" onSubmit={handleSubmit}>
        <div className="composer-input-wrapper">
          <textarea
            ref={textareaRef}
            id="chat-composer-input"
            className="composer-textarea"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            disabled={isLoading}
            aria-label="Ask a question about Dr. B. R. Ambedkar's writings"
          />

          <button
            type="submit"
            className="composer-send-btn"
            disabled={isSubmitDisabled}
            aria-label="Send question"
            title="Send question (Enter)"
          >
            {isLoading ? (
              <span className="composer-spinner" aria-hidden="true" />
            ) : (
              <span className="composer-send-icon" aria-hidden="true">
                ➤
              </span>
            )}
          </button>
        </div>

        <div className="composer-footer-note">
          <span>Primary sources only • Shift+Enter for new line • Enter to submit</span>
        </div>
      </form>
    </footer>
  );
}
