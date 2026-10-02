# Ask Ambedkar — Segment 0: Project Foundation

> **“Ask anything. Discover what Ambedkar wrote.”**

A public, anonymous research platform where anyone can ask a question and discover what Dr. B. R. Ambedkar's documented writings and recorded statements say about that subject.

This project is **not** an AI pretending to be Dr. B. R. Ambedkar. It prioritizes factual, verified primary sources over speculative generation or synthetic opinions.

---

## 1. Primary Source Philosophy

The knowledge base is designed to contain **strictly primary sources** directly attributable to Dr. B. R. Ambedkar:

1. **Books and authored works** (e.g., *Annihilation of Caste*, *The Problem of the Rupee*, *Who Were the Shudras?*)
2. **Speeches and addresses** (e.g., Mahad Satyagraha speech, Mukti Kon Pathe?)
3. **Interviews and recorded statements**
4. **Constituent Assembly Debates** (interventions, draft defense, constitutional provisions)
5. **Letters and personal correspondence**
6. **Articles and editorials** (e.g., *Mooknayak*, *Bahishkrit Bharat*, *Janata*, *Prabuddha Bharat*)

Biographies, third-party commentary, and secondary interpretations are excluded from answering questions in this system.

### Provenance Tracking
Every indexed passage retains complete bibliographic and archival provenance:
- **Work / Title** (e.g., *BAWS Vol. 1*, *Annihilation of Caste*)
- **Author** (`B. R. Ambedkar`)
- **Date / Year** of publication or delivery
- **Source Type** (`book`, `speech`, `interview`, `constituent_assembly_debate`, `letter`, `article_editorial`)
- **Chapter / Section / Volume**
- **Page Number**
- **Original Language** (`en`, `mr`, etc.)
- **Verbatim Original Text**
- **Reference / Archival Citation**

---

## 2. Core Answer Principle

> **Never invent an opinion and attribute it to Ambedkar.**

The system distinguishes between three evidence categories:
- **Directly Documented Statements**: Questions answered by an explicit, documented statement.
- **Multiple Documented Passages**: Conclusions synthesized across multiple supporting primary passages with direct citations.
- **Insufficient Evidence**: If available primary sources do not contain sufficient evidence to establish Ambedkar's documented position, the system explicitly states that no documented position exists. It never speculates on what Ambedkar "would have thought" about modern subjects (e.g., artificial intelligence, social media).

---

## 3. Architecture & Modular Boundaries

The system is architected around a strict decoupled pipeline:

```
[ User Browser / Client ]
            │
            ▼
[ Next.js Presentation & API Routes ] (src/app/api/...)
            │
            ▼
[ Question Processing Layer ]         (src/core/question_processing/)
            │
            ▼
[ Retrieval Layer ]                   (src/core/retrieval/)
            │
            ▼
[ Primary-Source Knowledge Base ]     (src/core/sources/)
            │
            ▼
[ Evidence Selection & Scoring ]      (src/core/evidence/)
            │
            ▼
[ Answer Generation & Citations ]     (src/core/answers/)
            │
            ▼
[ Client Response with Verbatim Sources ]
```

### Key Modules in `src/core/` (Framework-Independent)
All domain logic inside `src/core/` is decoupled from the web framework (Next.js) so it remains independently testable and portable:

- [`src/core/sources/`](src/core/sources/): Source definitions, provenance validation schemas, and repository contracts.
- [`src/core/question_processing/`](src/core/question_processing/): Normalization, language detection contracts, and query intent analysis.
- [`src/core/retrieval/`](src/core/retrieval/): Retrieval contracts supporting future BM25 full-text and vector semantic search.
- [`src/core/evidence/`](src/core/evidence/): Categorization into directly documented, multi-passage, or insufficient evidence.
- [`src/core/answers/`](src/core/answers/): Source-anchored answer schemas, citation builders, and non-speculation refusal templates.
- [`src/core/multilingual/`](src/core/multilingual/): Multilingual registry and context contracts (preserves original text as ground truth).
- [`src/core/sessions/`](src/core/sessions/): Ephemeral anonymous sessions and rate limiting (no accounts, no passwords).
- [`src/core/chat/`](src/core/chat/): End-to-end orchestration pipeline.

---

## 4. Project Structure

```
ask-ambedkar/
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment configuration
├── package.json                     # Dependencies and npm scripts
├── tsconfig.json                    # TypeScript strict mode configuration
├── next.config.ts                   # Next.js configuration
├── eslint.config.mjs                # ESLint configuration
├── README.md                        # Project documentation
├── scripts/                         # Future data ingestion & processing pipelines
│   └── README.md
├── src/
│   ├── app/                         # Presentation & HTTP Routing (Next.js App Router)
│   │   ├── api/                     # HTTP API Boundary
│   │   │   ├── health/route.ts      # Health check endpoint
│   │   │   ├── chat/route.ts        # Chat / Question answering endpoint
│   │   │   └── sources/route.ts     # Primary sources lookup endpoint
│   │   ├── globals.css              # Pure Vanilla CSS Design System (Layers, Tokens)
│   │   ├── layout.tsx               # Root layout, metadata, SEO, and typography
│   │   └── page.tsx                 # Interactive placeholder landing page
│   ├── config/                      # Validated application environment configuration
│   │   └── index.ts
│   └── core/                        # Decoupled Domain Logic Subsystems
│       ├── answers/                 # Answer generation & citations
│       ├── chat/                    # Orchestration pipeline
│       ├── evidence/                # Evidence evaluation & confidence thresholds
│       ├── multilingual/            # Multilingual registry & context
│       ├── question_processing/     # Question sanitization & intent
│       ├── retrieval/               # Hybrid retrieval contracts
│       ├── sessions/                # Anonymous ephemeral sessions
│       ├── sources/                 # Provenance schemas & source types
│       └── index.ts                 # Unified core domain exports
```

---

## 5. Technology Stack & Rationale

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Unified TypeScript fullstack runtime with built-in API boundary, server-side security, zero port conflicts during local dev. |
| **Language** | TypeScript 5 (Strict Mode) | End-to-end type safety across domain models, provenance schemas, and API contracts. |
| **Styling** | Pure Vanilla CSS (`@layer`) | Zero heavy CSS framework dependencies. Maximum flexibility, fast loading, custom academic dark/warm palette. |
| **Architecture** | Hexagonal / Clean Core | `src/core/` domain logic has zero dependency on Next.js or React, allowing independent unit testing. |
| **Authentication** | None (Anonymous by Design) | Anonymous usage principle — no user accounts, logins, or tracking. |

---

## 6. Development Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v22.23.0)
- **npm**: v9+ (tested on npm 10.9.8)

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quality Checks
```bash
# Typecheck TypeScript codebase
npm run typecheck

# Run linter
npm run lint

# Create production build
npm run build

# Start production server
npm run start
```

---

## 7. Segment 0 Status & Next Steps

This repository represents **Segment 0: Project Foundation**:
- [x] Project cleanly initialized with fullstack TypeScript architecture
- [x] Modular directory boundaries established (`src/core/` decoupled from UI/transport)
- [x] Provenance and source schemas defined with strict attribution rules
- [x] Evidence selection and non-speculation answer contracts established
- [x] Multilingual and anonymous session abstractions defined
- [x] Responsive, rich placeholder landing page and `/api/health` live
- [x] Build, lint, and typecheck all passing with 0 errors

### Planned for Subsequent Segments:
- **Segment 1**: Source Knowledge Base & BAWS Document Ingestion Pipeline
- **Segment 2**: Search & Semantic Vector Retrieval Engine
- **Segment 3**: Evidence Scoring & Source-Anchored Answer Generation
- **Segment 4**: Conversational Chat Experience & Verbatim Source Explorer
- **Segment 5**: Multilingual Support (Hindi, Marathi, etc.)
