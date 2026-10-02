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

## 10. Future Retrieval & Indexing (Segment 5+)

Segment 4 terminates with **validated structured corpus records**. It deliberately excludes:
- Dense vector embeddings (OpenAI, Gemini, local embeddings)
- Vector databases (Pinecone, Chroma, Qdrant, etc.)
- BM25 inverted lexical indexes
- Neural re-ranking models
- Hosted LLM calls

Segment 5 will consume the validated `data/corpus/*.jsonl` files to construct retrieval indices and lexical/dense search mechanisms.

