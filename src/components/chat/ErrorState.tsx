'use client';

import React from 'react';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="chat-error-row" role="alert">
      <div className="chat-error-card">
        <div className="error-icon" aria-hidden="true">⚠️</div>
        <div className="error-body">
          <h4 className="error-title">Something went wrong</h4>
          <p className="error-desc">
            {message || "We couldn't process this question. Please try again."}
          </p>
        </div>
        <button
          type="button"
          className="error-retry-btn"
          onClick={onRetry}
          aria-label="Retry submitting the question"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
