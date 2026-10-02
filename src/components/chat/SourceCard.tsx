'use client';

import React from 'react';
import { MockSourceCardData } from '@/mock/chatData';

interface SourceCardProps {
  source: MockSourceCardData;
  onViewEvidence: (evidenceId: string) => void;
}

export function SourceCard({ source, onViewEvidence }: SourceCardProps) {
  return (
    <article className="source-card" aria-label={`Source: ${source.workTitle}`}>
      <div className="source-card-main">
        <div className="source-card-meta">
          <span className="source-card-type">{source.sourceType}</span>
          {source.year && (
            <>
              <span className="meta-bullet">•</span>
              <span className="source-card-year">{source.year}</span>
            </>
          )}
        </div>

        <h4 className="source-card-title">{source.workTitle}</h4>

        {source.chapterOrSection && (
          <p className="source-card-section">{source.chapterOrSection}</p>
        )}
      </div>

      <div className="source-card-action">
        <button
          type="button"
          className="view-evidence-btn"
          onClick={() => onViewEvidence(source.evidenceId)}
          aria-label={`View evidence from ${source.workTitle}`}
        >
          <span>View evidence</span>
          <span className="btn-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
