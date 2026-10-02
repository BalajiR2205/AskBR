'use client';

import React, { useState, useEffect } from 'react';

interface ApiResponse {
  answer: {
    question: string;
    answerText: string;
    status: string;
    evidenceCategory: string;
    disclaimer: string;
  };
  processedQuestion: {
    normalizedText: string;
    isModernSpeculationQuestion: boolean;
  };
}

export default function HomePage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthStatus(`Online (${data.environment})`))
      .catch(() => setHealthStatus('Offline'));
  }, []);

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Error fetching chat response:', err);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    'What did Ambedkar write regarding democracy and social equality?',
    'What did Ambedkar think about artificial intelligence?',
    'What did Ambedkar state in the Constituent Assembly debates regarding caste?',
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span>●</span>
          <span>Segment 0 Foundation — Application Running</span>
        </div>

        <h1 className="hero-title">Ask Ambedkar</h1>
        <p className="hero-tagline">“Ask anything. Discover what Ambedkar wrote.”</p>
        
        <p className="hero-description">
          A public, anonymous research platform helping people explore Dr. B. R. Ambedkar’s documented thought 
          using strictly primary sources. Factual source-based answers over AI speculation.
        </p>
      </section>

      {/* Interactive Query Demonstration Card */}
      <section className="interactive-query-card" aria-label="Ask a question preview">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(question);
          }}
        >
          <div className="query-input-wrapper">
            <input
              id="question-input"
              className="query-input"
              type="text"
              placeholder="Ask a question (e.g. What did Ambedkar say about democracy?)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              aria-label="Question input"
            />
            <button
              id="submit-question-btn"
              type="submit"
              className="query-submit-btn"
              disabled={loading}
            >
              {loading ? 'Evaluating...' : 'Discover'}
            </button>
          </div>
        </form>

        <div className="sample-queries-container">
          <span className="sample-label">Try Sample:</span>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              className="sample-chip"
              onClick={() => {
                setQuestion(sample);
                handleQuery(sample);
              }}
            >
              {sample.length > 45 ? `${sample.slice(0, 45)}...` : sample}
            </button>
          ))}
        </div>

        {/* Live Contract Demonstration Box */}
        {response && (
          <div className="preview-response-box" id="query-response-preview">
            <span
              className={`response-badge ${
                response.answer.status === 'modern_speculation_refusal'
                  ? 'badge-speculation'
                  : 'badge-insufficient'
              }`}
            >
              {response.answer.status === 'modern_speculation_refusal'
                ? 'Core Rule: Modern Speculation Refusal'
                : 'Core Rule: Non-Invented Opinion (Segment 0 Placeholder)'}
            </span>
            <p style={{ marginBottom: '0.75rem', fontWeight: 500 }}>
              {response.answer.answerText}
            </p>
            <p className="font-mono text-muted" style={{ fontSize: '0.78rem' }}>
              Note: Primary source ingestion and semantic retrieval pipelines will be populated in subsequent segments.
            </p>
          </div>
        )}
      </section>

      {/* Core Principles Grid */}
      <section style={{ marginBlock: '2rem 4rem' }}>
        <div className="section-heading-group">
          <h2 className="section-title">Core Principles</h2>
          <p className="section-subtitle">
            Engineered around intellectual fidelity and verifiable primary historical records.
          </p>
        </div>

        <div className="philosophy-grid">
          <div className="philosophy-card">
            <div className="card-icon">📚</div>
            <h3 className="card-title">Strict Primary Sources</h3>
            <p className="card-description">
              Restricted exclusively to works authored by Ambedkar: books, speeches, interviews, Constituent Assembly debates, letters, and editorials. No third-party commentary.
            </p>
          </div>

          <div className="philosophy-card">
            <div className="card-icon">⚖️</div>
            <h3 className="card-title">Never Invent Opinions</h3>
            <p className="card-description">
              If the documented writings do not establish Ambedkar’s position, the system explicitly says so. It will never generate what Ambedkar “would have thought.”
            </p>
          </div>

          <div className="philosophy-card">
            <div className="card-icon">🔍</div>
            <h3 className="card-title">Verifiable Provenance</h3>
            <p className="card-description">
              Every answer will point users directly to the supporting primary passage with work, volume, chapter, section, page, and original verbatim text.
            </p>
          </div>

          <div className="philosophy-card">
            <div className="card-icon">🌐</div>
            <h3 className="card-title">Anonymous & Multilingual</h3>
            <p className="card-description">
              Zero accounts, zero logins, zero tracking. Open to all with future multilingual capabilities while preserving the original source text as the source of truth.
            </p>
          </div>
        </div>
      </section>

      {/* Architectural Pipeline Overview */}
      <section className="architecture-section">
        <div className="section-heading-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>System Architecture (Segment 0)</h2>
            <span className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
              Healthcheck: <strong style={{ color: '#34d399' }}>{healthStatus}</strong>
            </span>
          </div>
          <p className="section-subtitle" style={{ margin: '0.5rem 0 0 0' }}>
            Decoupled, modular architecture separating presentation, retrieval, evidence evaluation, and answer synthesis.
          </p>
        </div>

        <div className="pipeline-flow" aria-label="Architecture Pipeline">
          <div className="pipeline-step active">User Question</div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-step active">API Boundary</div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-step">Question Processing</div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-step">Retrieval Layer</div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-step">Evidence Selection</div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-step">Answer Generation</div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-step">Citations & Provenance</div>
        </div>

        <div className="architecture-grid">
          <div className="arch-module-card">
            <div className="arch-module-header">
              <span className="arch-module-name">src/core/sources</span>
              <span className="arch-module-badge">Configured</span>
            </div>
            <p className="arch-module-desc">
              Primary source schemas, provenance validation (title, volume, chapter, page, verbatim text), and repository contracts.
            </p>
          </div>

          <div className="arch-module-card">
            <div className="arch-module-header">
              <span className="arch-module-name">src/core/retrieval</span>
              <span className="arch-module-badge">Configured</span>
            </div>
            <p className="arch-module-desc">
              Retrieval engine interface supporting future hybrid (full-text BM25 + vector embeddings) search with metadata filtering.
            </p>
          </div>

          <div className="arch-module-card">
            <div className="arch-module-header">
              <span className="arch-module-name">src/core/evidence</span>
              <span className="arch-module-badge">Configured</span>
            </div>
            <p className="arch-module-desc">
              Categorizes evidence into directly documented statements, synthesized passages, or insufficient evidence.
            </p>
          </div>

          <div className="arch-module-card">
            <div className="arch-module-header">
              <span className="arch-module-name">src/core/answers</span>
              <span className="arch-module-badge">Configured</span>
            </div>
            <p className="arch-module-desc">
              Generates source-anchored answers, citation mapping, and explicit refusal templates for anachronistic queries.
            </p>
          </div>

          <div className="arch-module-card">
            <div className="arch-module-header">
              <span className="arch-module-name">src/core/multilingual</span>
              <span className="arch-module-badge">Configured</span>
            </div>
            <p className="arch-module-desc">
              Multi-language registry and context contracts ensuring original primary source passages remain the source of truth.
            </p>
          </div>

          <div className="arch-module-card">
            <div className="arch-module-header">
              <span className="arch-module-name">src/core/sessions</span>
              <span className="arch-module-badge">Configured</span>
            </div>
            <p className="arch-module-desc">
              Anonymous, ephemeral session handling with non-intrusive rate-limiting. Strictly no accounts or user profiling.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
