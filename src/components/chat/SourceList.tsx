'use client';

import React from 'react';
import { MockSourceCardData } from '@/mock/chatData';
import { SourceCard } from './SourceCard';

interface SourceListProps {
  sourceSummary?: string;
  sources?: MockSourceCardData[];
  onViewEvidence: (evidenceId: string) => void;
}

export function SourceList({ sourceSummary, sources, onViewEvidence }: SourceListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <section className="source-list-section" aria-label="Supporting primary sources">
      <div className="source-list-header">
        <div className="source-summary-badge">
          <span className="source-badge-icon" aria-hidden="true">📜</span>
          <span>{sourceSummary || `Based on ${sources.length} primary source${sources.length === 1 ? '' : 's'}`}</span>
        </div>
      </div>

      <div className="source-cards-grid">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            onViewEvidence={onViewEvidence}
          />
        ))}
      </div>
    </section>
  );
}
