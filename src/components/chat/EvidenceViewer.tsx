'use client';

import React, { useEffect, useRef } from 'react';
import { MockEvidence } from '@/mock/chatData';

interface EvidenceViewerProps {
  evidence: MockEvidence | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EvidenceViewer({ evidence, isOpen, onClose }: EvidenceViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Handle Escape key
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    // Handle backdrop click (light dismiss fallback)
    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const isInContent =
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width;
        if (!isInContent) {
          onClose();
        }
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  if (!evidence) return null;

  return (
    <dialog
      ref={dialogRef}
      id="evidence-dialog"
      className="evidence-dialog"
      aria-labelledby="evidence-dialog-title"
      aria-modal="true"
    >
      <div className="evidence-dialog-content">
        {/* Header */}
        <div className="evidence-dialog-header">
          <div className="evidence-header-tag">
            <span className="source-tag-dot" />
            <span>PRIMARY SOURCE EVIDENCE</span>
          </div>
          <button
            type="button"
            className="evidence-close-btn"
            onClick={onClose}
            aria-label="Close evidence panel"
          >
            ✕
          </button>
        </div>

        {/* Source Title & Subheader */}
        <div className="evidence-source-meta">
          <h2 id="evidence-dialog-title" className="evidence-work-title">
            {evidence.workTitle}
          </h2>
          <div className="evidence-pills-row">
            <span className="evidence-pill">{evidence.sourceType}</span>
            {evidence.year && <span className="evidence-pill">{evidence.year}</span>}
            {evidence.page && <span className="evidence-pill">{evidence.page}</span>}
          </div>
          {evidence.chapterOrSection && (
            <p className="evidence-section-text">{evidence.chapterOrSection}</p>
          )}
        </div>

        {/* Verbatim Historical Passage */}
        <div className="evidence-passage-section">
          <span className="evidence-label">Original Recorded Passage</span>
          <blockquote className="evidence-blockquote">
            <p>{evidence.verbatimPassage}</p>
          </blockquote>
        </div>

        {/* Source Metadata & Archival Provenance */}
        <div className="evidence-provenance-box">
          <span className="evidence-label">Bibliographic Provenance</span>
          <dl className="provenance-grid">
            <div className="provenance-item">
              <dt>Author</dt>
              <dd>{evidence.metadata.author}</dd>
            </div>
            <div className="provenance-item">
              <dt>Source Type</dt>
              <dd>{evidence.sourceType}</dd>
            </div>
            <div className="provenance-item">
              <dt>Original Language</dt>
              <dd>{evidence.metadata.originalLanguage}</dd>
            </div>
            {evidence.metadata.volume && (
              <div className="provenance-item">
                <dt>Collection / Volume</dt>
                <dd>{evidence.metadata.volume}</dd>
              </div>
            )}
            <div className="provenance-item full-width">
              <dt>Archival Reference</dt>
              <dd>{evidence.metadata.reference}</dd>
            </div>
          </dl>
        </div>

        {/* Footer actions */}
        <div className="evidence-dialog-footer">
          <button
            type="button"
            className="evidence-action-close"
            onClick={onClose}
          >
            Close Evidence
          </button>
        </div>
      </div>
    </dialog>
  );
}
