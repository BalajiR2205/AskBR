# Ask Ambedkar — Ingestion Pipeline Documentation

This directory contains offline data-engineering scripts and utilities for ingesting verified primary source documents into the **Ask Ambedkar** structured corpus.

---

## 1. Architectural Principles

1. **Primary Sources Only**: Only authentic primary materials authored or recorded by Dr. B. R. Ambedkar (books, speeches, interviews, Constituent Assembly debates, letters, articles, editorials) are accepted into the corpus.
2. **Immutable Original Text**: Verbatim extracted text (`originalText`) is immutable and never overwritten, summarized, modernized, or replaced.
3. **Segregated Search & Normalized Text**: Secondary text normalization (whitespace collapsing, line-wrap hyphen reconnection) is stored separately in `normalizedText`.
4. **Controlled Metadata & Manifests**: Every document must be accompanied by explicit bibliographic metadata via a source manifest.
5. **Deterministic Provenance**: Every extracted passage carries complete provenance tracing back through Section, Page, Edition, and Source.
6. **No Runtime Dependencies**: Ingestion is an offline data-engineering pipeline. It does not import Next.js, React, or browser-only libraries.

---

## 2. Directory Structure

```text
data/
  ├── inbox/             Raw source files manually supplied for ingestion (PDF, TXT, MD, JSON)
  ├── working/           Temporary working files, extracted caches, and execution reports
  │     └── reports/     Human-readable and structured JSON ingestion reports
  ├── validated/         Pre-corpus staging directory for inspected and validated records
  ├── rejected/          Reports for malformed sources, validation failures, or OCR-required files
  └── corpus/            Canonical structured primary corpus dataset in JSONL format
        ├── sources.jsonl
        ├── editions.jsonl
        ├── sections.jsonl
        ├── passages.jsonl
        └── .ingestion-registry.json
```

---

## 3. Supported Input Formats

| Format | Extension | Extractor Details | Page Preservation |
| :--- | :--- | :--- | :--- |
| **PDF** | `.pdf` | Node.js `unpdf` page-by-page extractor | Preserves exact physical page numbers and boundaries |
| **TXT** | `.txt` | Form-feed (`\f`) and page marker (`--- PAGE N ---`) parser | Preserves demarcated page boundaries |
| **Markdown**| `.md`, `.markdown` | Heading and page comment (`<!-- page N -->`) parser | Preserves headings, frontmatter, and pages |
| **JSON** | `.json` | Structured page array parser (`{ pages: [...] }`) | Preserves structured page objects |

---

## 4. Source Manifest Format

Each source requires an explicit source manifest JSON file, either specified via `--source-manifest <path>` or placed alongside the source file as `<filename>.manifest.json`.

```json
{
  "sourceId": "src_book_aoc_1936",
  "title": "Annihilation of Caste",
  "subtitle": "With a Reply to Mahatma Gandhi",
  "sourceType": "BOOK",
  "classification": "PRIMARY",
  "status": "VERIFIED",
  "author": "Dr. B. R. Ambedkar",
  "originalLanguage": "en",
  "languagesAvailable": ["en"],
  "year": 1936,
  "publisher": "B. R. Ambedkar",
  "sourceReference": "BAWS Vol. 1, Government of Maharashtra (1979)",
  "externalReference": "https://www.mea.gov.in/books-writings-of-ambedkar.htm",
  "edition": {
    "id": "edn_aoc_1936_1st",
    "editionName": "First Edition (1936)",
    "year": 1936,
    "publisher": "Self-published, Bombay",
    "isAuthoritative": true
  }
}
```

---

## 5. Ingestion Status Lifecycle

```text
DISCOVERED ─────────► EXTRACTING ─────────► EXTRACTED ─────────► NORMALIZING
                                               │
                                               ▼ (Sparse / scanned)
                                          OCR_REQUIRED

NORMALIZING ────────► SEGMENTING ─────────► VALIDATING ────────► READY
                                               │
                                               ▼ (Schema / provenance failure)
                                            REJECTED
```

- **READY**: Successfully extracted, segmented, validated, and appended to `data/corpus/*.jsonl`.
- **ALREADY_INGESTED**: Source ID and file SHA-256 hash match an existing entry in `.ingestion-registry.json`. No duplicate records are written.
- **OCR_REQUIRED**: Extracted text contains less than the required selectable character threshold (averaging < 50 chars/page), indicating a scanned document requiring OCR in a later segment.
- **REJECTED**: Source manifest missing, attribution invalid, or passage validation failed.
- **FAILED**: File unreadable or syntax error during extraction.

---

## 6. CLI Usage & Commands

### Standard Ingestion
```bash
npm run ingest -- --input data/inbox/sample-test-document.txt
```

### Dry Run (Validation Only)
Simulates extraction, segmentation, and validation without modifying corpus JSONL files:
```bash
npm run ingest -- --input data/inbox/sample-test-document.txt --dry-run
```

### Explicit Manifest & Output Directory
```bash
npm run ingest -- --input data/inbox/document.pdf --source-manifest data/manifests/custom.json --output data/corpus
```

### Direct Script Invocation
```bash
npx tsx scripts/ingestion/cli.ts --input data/inbox/sample-test-document.md --dry-run
```

---

## 7. Passage Segmentation & Stable IDs

- **Segmentation Policy**:
  - `maxCharacters: 1200` (~200–250 words, representing a coherent intellectual argument).
  - `minCharacters: 150` (avoids fragmenting solitary section numbers or headers).
  - `overlapCharacters: 100` (modest boundary overlap to maintain rhetorical context).
- **Deterministic ID Scheme**:
  `psg_<sourceId>_<sectionSlug>_<sequenceString>` (e.g., `psg_src_aoc_1936_ch01_001`).

---

## 8. Corpus Output Files

Outputs are appended in newline-delimited JSON (`JSONL`):

1. `data/corpus/sources.jsonl`: Source parent entities (`Source`).
2. `data/corpus/editions.jsonl`: Specific edition records (`Edition`).
3. `data/corpus/sections.jsonl`: Document structural nodes (`DocumentSection`).
4. `data/corpus/passages.jsonl`: Atomic retrieval passages (`Passage`).
5. `data/corpus/.ingestion-registry.json`: Cryptographic hash registry for idempotency.

---

## 9. Known Limitations

1. **OCR Processing Deferred**: Scanned PDFs with non-selectable or bitmap-only pages are identified and flagged with `OCR_REQUIRED`. OCR engines (e.g., Tesseract or cloud document OCR) are deferred to a dedicated post-ingestion segment to keep this pipeline deterministic and lightweight.
2. **Complex Multi-Column Footnotes**: Footnotes embedded at the foot of pages are preserved as raw page text, but automated semantic separation of inline footnotes vs. main text requires deeper typographic heuristics.
3. **Table & Figure Extraction**: Tabular data is extracted as plain text lines. Rich cell grid modeling is not performed.
4. **Header/Footer Frequency Threshold**: Running headers/footers require at least 3 pages to detect repeating patterns (>= 60% frequency threshold). Shorter texts preserve all lines verbatim.

---

## 10. Segment 5: Hybrid Retrieval & Search Indexing

The retrieval subsystem consumes the validated canonical corpus (`data/corpus/*.jsonl`) and builds deterministic, offline-indexed lexical and vector representations in `data/index/`.

### Architectural Overview

```text
                    SearchQuery
                         │
                 Query Processing
                         │
             ┌───────────┴───────────┐
             │                       │
       BM25 / Lexical          Vector Search (Dense)
             │                       │
             └───────────┬───────────┘
                         ↓
                  Score Normalization
                         ↓
                   Hybrid Fusion
                         ↓
                  Metadata & Authority Filtering
                         ↓
                 Top-K Search Results + Provenance
                         ↓
             Segment 6 Evidence Evaluation
```

### Core Invariants

1. **Primary Sources Only**: Only primary materials authored by Dr. B. R. Ambedkar (`classification = PRIMARY`, `status = VERIFIED | PUBLISHED`) can be returned as authoritative evidence.
2. **Framework Agnostic**: The retrieval domain (`src/core/retrieval/`) contains zero imports of React, Next.js, or browser APIs.
3. **Offline Indexing**: Index construction is strictly an offline batch process (`npm run index`). The runtime server does not build indexes on request.
4. **No Hallucinated Embeddings**: When no embedding provider is configured (`EMBEDDING_PROVIDER=none`), vector retrieval gracefully disables and the system transparently falls back to BM25 lexical search (`retrievalMethod: "full_text"`). Fake embeddings are strictly isolated to unit testing (`FakeEmbeddingProvider`).
5. **Score Normalization**: Lexical BM25 scores (unbounded $\ge 0$) and dense cosine similarities ($[-1, 1]$ mapped to $[0, 1]$) are normalized before weighted linear combination.

---

## 11. Indexing CLI (`npm run index`)

Builds offline BM25 and dense vector indexes from `data/corpus/` into `data/index/`.

### Usage & Flags

```bash
# Standard build (incremental: reuses unchanged vectors, regenerates lexical index)
npm run index

# Force complete rebuild from scratch
npm run index -- --rebuild

# Validate existing index integrity against canonical corpus
npm run index -- --validate

# Custom corpus and index directories
npm run index -- --corpus data/corpus --output data/index

# Build with vector embeddings enabled (requires configured EMBEDDING_API_KEY)
npm run index -- --vector
```

### Stored Index Structure

```text
data/index/
  ├── manifest.json       # Schema version, corpus SHA-256 hash, passage/source counts, config
  ├── bm25/
  │   └── index.json      # Inverted index, document lengths, and corpus token statistics
  └── vectors/
      └── index.json      # Passage IDs, dense float arrays, and vector dimensions
```

### Incremental Indexing Strategy

- The indexer computes a content hash (`sha256(passage.normalizedText + passage.sourceId + passage.sectionId)`) for each passage.
- When existing vector records match the content hash and passage ID, embeddings are preserved without making redundant API calls.
- Stale or deleted passages are pruned from the vector index.
- If `--rebuild` is specified, all indexes are recomputed from the validated corpus.

---

## 12. Search CLI (`npm run search`)

Developer-facing search tool for testing retrieval accuracy and inspecting ranking scores.

### Usage & Flags

```bash
# Natural-language search
npm run search -- "Ambedkar on caste equality"

# Exact phrase search
npm run search -- "annihilation of caste" --topK 5

# Filtered search (primary sources only)
npm run search -- "constitutional morality" --classification PRIMARY --status VERIFIED

# Force lexical-only or vector-only mode
npm run search -- "fraternity and liberty" --lexical-only
```

### Output Example

```text
================================================================================
Ask Ambedkar — Hybrid Search
================================================================================
Query:            "constitutional morality"
Mode:             hybrid (lexical weight: 0.50, vector weight: 0.50)
Results returned: 3

1. Speech on the Draft Constitution
   Author:        Dr. B. R. Ambedkar
   Classification: PRIMARY (VERIFIED)
   Edition:       CAD Vol. VII (1948)
   Section:       Constituent Assembly of India (Pages 38–42)
   Relevance:     0.9124
   Method:        hybrid
   Scores:        Lexical=14.32 (norm: 0.8800) | Vector=0.9448 (norm: 0.9448)
   Excerpt:       "...Constitutional morality is not a natural sentiment. It has to be cultivated..."

================================================================================
```

---

## 13. Retrieval Mathematical Specifications

### BM25 Robertson-Spärck Jones Formula

$$
\text{IDF}(q_i) = \ln \left( \frac{N - n(q_i) + 0.5}{n(q_i) + 0.5} + 1 \right)
$$

$$
\text{Score}_{\text{BM25}}(D, Q) = \sum_{q_i \in Q} \text{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}
$$

- Default parameters: $k_1 = 1.2$, $b = 0.75$.
- **Field Weighting**: Passage text carries primary weight ($1.0$), section title ($0.3$), source title ($0.2$).
- **Exact Phrase Boost**: Passages containing the exact consecutive query phrase receive a configurable multiplier boost ($1.5\times$).

### Score Normalization & Hybrid Fusion

$$
\text{normLex}(s) = \frac{s - s_{\min}}{s_{\max} - s_{\min}} \quad (\text{Min-Max scaling over candidate pool})
$$

$$
\text{normVec}(v) = \frac{\cos(\mathbf{q}, \mathbf{d}) + 1}{2} \quad (\text{Mapping } [-1, 1] \text{ to } [0, 1])
$$

$$
\text{Score}_{\text{Hybrid}} = w_{\text{lex}} \cdot \text{normLex} + w_{\text{vec}} \cdot \text{normVec}
$$

- Default engineering weights: $w_{\text{lex}} = 0.5$, $w_{\text{vec}} = 0.5$.
- Candidate pooling: candidate pool size = $\text{topK} \times \text{candidateMultiplier}$ ($\text{candidateMultiplier} = 4$).

---

## 14. Retrieval Evaluation Harness

The retrieval subsystem includes an evaluation harness (`src/core/retrieval/evaluation.ts`) calculating standard Information Retrieval (IR) metrics against synthetic test fixtures:
- **Recall@K**: Proportion of relevant passages retrieved within the top $K$ results.
- **Precision@K**: Proportion of retrieved top $K$ results that are relevant.
- **MRR (Mean Reciprocal Rank)**: Reciprocal rank of the first relevant passage retrieved.

