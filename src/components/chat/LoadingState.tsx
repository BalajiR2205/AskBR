'use client';

import React from 'react';

export function LoadingState() {
  return (
    <div className="chat-loading-row" aria-live="polite" aria-label="Loading response">
      <div className="assistant-avatar" aria-hidden="true">
        <span>अ</span>
      </div>

      <div className="loading-card">
        <div className="loading-status-line">
          <span className="loading-spinner" aria-hidden="true" />
          <span className="loading-text">Searching Ambedkar’s writings...</span>
        </div>

        <div className="skeleton-container" aria-hidden="true">
          <div className="skeleton-line line-1" />
          <div className="skeleton-line line-2" />
          <div className="skeleton-line line-3" />
        </div>
      </div>
    </div>
  );
}
