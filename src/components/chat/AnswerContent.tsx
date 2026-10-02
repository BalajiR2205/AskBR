'use client';

import React from 'react';

interface AnswerContentProps {
  content: string;
  status?: 'sufficient_evidence' | 'insufficient_evidence' | 'error';
}

export function AnswerContent({ content, status }: AnswerContentProps) {
  // Split into paragraphs for readable typography
  const paragraphs = content.split('\n\n').filter(Boolean);

  return (
    <div className={`answer-content-wrapper ${status === 'insufficient_evidence' ? 'status-insufficient' : ''}`}>
      {status === 'insufficient_evidence' && (
        <div className="insufficient-evidence-banner">
          <span className="banner-icon" aria-hidden="true">ℹ️</span>
          <span>Primary Source Limitation / Mock Placeholder</span>
        </div>
      )}

      <div className="answer-paragraphs">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="answer-paragraph">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
