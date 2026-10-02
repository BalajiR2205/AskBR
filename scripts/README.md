# Ingestion & Data Pipelines (Future Segments)

This directory is reserved for offline ingestion, OCR verification, and text chunking pipelines for Dr. B. R. Ambedkar's primary sources.

## Target Collections for Future Ingestion:
1. **Babasaheb Ambedkar: Writings and Speeches (BAWS)** — Volumes 1 through 22+
2. **Constituent Assembly Debates (CAD)** — Statements and interventions by Dr. B. R. Ambedkar
3. **Periodicals and Editorials** — Mooknayak, Bahishkrit Bharat, Janata, Prabuddha Bharat
4. **Speeches & Interviews** — Verified historical audio transcripts and published proceedings
5. **Correspondence & Letters** — Official and personal archives

## Pipeline Flow:
```
Primary PDFs / Scans / Transcripts
  ↓
Extraction & Verification
  ↓
Metadata & Provenance Tagging (Work, Chapter, Page, Date, Type)
  ↓
Passage Segmentation
  ↓
Vector Embeddings & BM25 Inverted Index
```
