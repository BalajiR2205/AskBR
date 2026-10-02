'use client';

import React from 'react';

interface SuggestedQuestionProps {
  question: string;
  onClick: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestion({ question, onClick, disabled }: SuggestedQuestionProps) {
  return (
    <button
      type="button"
      className="suggested-question-btn"
      onClick={() => onClick(question)}
      disabled={disabled}
      aria-label={`Ask: ${question}`}
    >
      <span className="question-text">{question}</span>
      <span className="question-arrow" aria-hidden="true">→</span>
    </button>
  );
}
