# Ask Ambedkar

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

Biographies, third-party commentary, academic interpretations, and secondary opinions are strictly excluded from serving as authoritative answer evidence.

### Core Answer Principle
> **Never invent an opinion and attribute it to Ambedkar.**

The system distinguishes between three evidence categories:
- **Directly Documented Statements**: Questions answered by an explicit, documented primary statement.
- **Multiple Documented Passages**: Conclusions synthesized across multiple supporting primary passages with direct citations.
- **Insufficient Evidence**: If available primary sources do not contain sufficient evidence to establish Ambedkar's documented position, the system explicitly states that no documented position exists. It never speculates on what Ambedkar "would have thought" about modern subjects (e.g., artificial intelligence, social media).

---

## 2. Ask Ambedkar Knowledge Architecture

The architecture treats the original source as an authoritative, independent entity. The retrieval and answer generation layers consume source data without owning or modifying it.

```text
                SOURCE
                  │
          ┌───────┴────────┐
          │                │
       EDITION          METADATA
          │
       SECTION
          │
       PASSAGE (Atomic Retrieval Unit)
          │
      PROVENANCE
          │
          ▼
   FUTURE RETRIEVAL
          │
          ▼
       EVIDENCE
          │
          ▼
     FUTURE ANSWER
```

### Supported Source Categories
Sources are classified under a strictly controlled enum:
- `BOOK`: Monographic works, treatises, and pamphlets authored by Ambedkar.
- `SPEECH`: Public addresses, presidential speeches, and conference lectures.
- `INTERVIEW`: Recorded question-and-answer transcripts with journalists or delegations.
- `CONSTITUENT_ASSEMBLY`: Interventions, debates, and draft defenses in the Constituent Assembly.
- `LETTER`: Formal and personal correspondence, retaining recipient details.
- `ARTICLE`: Essays and contributions published in periodicals and journals.
- `EDITORIAL`: Editorials authored by Ambedkar in newspapers he founded (*Mooknayak*, *Bahishkrit Bharat*, *Janata*, *Prabuddha Bharat*).

### Document Hierarchy & Edition Awareness
A source work can be navigated hierarchically across arbitrary depths:
```text
Document / Work (e.g., Annihilation of Caste)
 └── Edition (e.g., 1st Edition 1936, BAWS Vol. 1 Edition 1979)
      └── Chapter / Section (e.g., Chapter XIV)
           └── Subsection
                └── Passage (Atomic text block with verbatim text & page range)
```

Page numbers are inherently edition-specific. The architecture models `Edition` records separately so that citations point to exact editions and pages without ambiguity.

### Original vs. Processed Text
A source passage maintains strict separation between its historical text and algorithmic representations:
- **`originalText`**: The immutable, verbatim primary text as printed or recorded. This field is never altered, summarized, or translated.
- **`normalizedText`**: Cleaned unicode and standardized whitespace representation used for vector embeddings and search indexing.
- **`searchText`**: Tokenized keywords and search stems.
- **`ocrMetadata`**: Optional raw OCR text, confidence score, and verification flags for scanned archives.

### Translation Architecture
Translations do not overwrite original sources:
- `isOriginal: true` marks the authentic source text in its historical language (e.g. Marathi or English).
- Translations are modeled as linked versions (`translationType: 'PUBLISHED_TRANSLATION' | 'GENERATED_TRANSLATION'`) pointing to `originalPassageId`.
- A generated translation is never presented as if Ambedkar originally wrote it.

### Primary vs. Secondary Classification
Every source is classified as `PRIMARY` or `SECONDARY`. Only `PRIMARY` sources authored by Dr. B. R. Ambedkar can be retrieved as authoritative evidence for answers. Secondary materials can only exist for background cataloguing and are filtered out of answer synthesis.

### Data Integrity Invariants
1. **Rule 1 (Immutability)**: Original source text is immutable and can never be made empty or modified.
2. **Rule 2 (Separation)**: Processed/search text must never replace original text.
3. **Rule 3 (Translation Integrity)**: Translations must never replace original text.
4. **Rule 4 (Traceability)**: Every evidence passage must retain full provenance.
5. **Rule 5 (Attribution)**: Every source must possess explicit attribution.
6. **Rule 6 (Classification)**: Primary and secondary materials are strictly segregated.
7. **Rule 7 (Verification)**: Unverified draft material cannot be used as authoritative evidence.
8. **Rule 8 (No Fake AI Text)**: Generated AI content must never be stored as source text.

---

## 3. Repository Abstraction

All data access is mediated through storage-independent repository interfaces:
- **`SourceRepository`**: Manages Source entities, filtering by category, classification, and status.
- **`EditionRepository`**: Manages editions linked to works.
- **`SectionRepository`**: Manages hierarchical document structures (chapters, sections, topics).
- **`PassageRepository`**: Manages atomic passages, enforcing original text immutability and translation linking.

In-memory reference implementations (`InMemorySourceRepository`, `InMemoryPassageRepository`, etc.) are provided in `src/core/` and can be swapped with PostgreSQL (`pgvector`), SQLite (`sqlite-vec`), or document stores without altering domain logic.

---

## 4. Project Structure

```
ask-ambedkar/
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment configuration
├── package.json                     # Scripts: dev, build, start, lint, typecheck, test
├── tsconfig.json                    # TypeScript strict mode configuration
├── next.config.ts                   # Next.js configuration
├── eslint.config.mjs                # ESLint configuration
├── README.md                        # Project documentation & architecture
│
├── test/                            # Automated test suites
│   └── source-architecture.test.ts  # 23 tests verifying schemas, validation & repositories
│
├── src/
│   ├── app/                         # Presentation & HTTP Routing (App Router)
│   │   ├── api/                     # HTTP API Boundary
│   │   │   ├── health/route.ts      # Health check endpoint
│   │   │   ├── chat/route.ts        # Chat query endpoint
│   │   │   └── sources/route.ts     # Sources catalog endpoint
│   │   ├── chat/page.tsx            # Dedicated Chat Experience (/chat)
│   │   ├── globals.css              # Pure Vanilla CSS Design System (@layer)
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Landing / Overview page
│   │
│   ├── components/chat/             # Modular Chat Interface Components
│   │   ├── AnswerContent.tsx        # Styled answer text with clear evidence distinction
│   │   ├── AssistantMessage.tsx     # Assistant response row with avatar & sources
│   │   ├── ChatComposer.tsx         # Auto-resizing textarea with keyboard shortcuts
│   │   ├── ChatEmptyState.tsx       # Introductory view with suggested questions
│   │   ├── ChatHeader.tsx           # Top navigation bar with New Chat action
│   │   ├── ChatPage.tsx             # Main chat view controller
│   │   ├── ErrorState.tsx           # Retryable error alert card
│   │   ├── EvidenceViewer.tsx       # Accessible <dialog> modal for verbatim primary sources
│   │   ├── LoadingState.tsx         # Skeleton shimmer animation
│   │   ├── MessageList.tsx          # Scrollable message history with auto-scroll
│   │   ├── SourceCard.tsx           # Primary source card with "View evidence" action
│   │   ├── SourceList.tsx           # Grid of supporting sources
│   │   ├── SuggestedQuestion.tsx    # Interactive topic suggestion buttons
│   │   ├── UserMessage.tsx          # Clean user question card
│   │   └── types.ts                 # Chat UI state contracts
│   │
│   ├── config/                      # Validated runtime configuration
│   │   └── index.ts
│   │
│   ├── core/                        # Decoupled Domain Logic (Framework-Agnostic)
│   │   ├── answers/                 # Answer generation contracts & refusal templates
│   │   ├── chat/                    # Orchestration pipeline
│   │   ├── evidence/                # Future Evidence contracts & evaluation logic
│   │   ├── multilingual/            # Multilingual registry & context
│   │   ├── passages/                # Canonical Passage model, validation & repository
│   │   │   ├── repository.ts
│   │   │   ├── types.ts
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   ├── provenance/              # Provenance model & academic citation formatter
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── question_processing/     # Query sanitization & topic heuristics
│   │   ├── retrieval/               # Future Retrieval contracts (SearchQuery, SearchResult)
│   │   ├── sessions/                # Ephemeral anonymous sessions & rate limits
│   │   ├── sources/                 # Canonical Source model, validation, repository & fixtures
│   │   │   ├── fixtures.ts
│   │   │   ├── repository.ts
│   │   │   ├── types.ts
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   └── index.ts                 # Unified domain exports
│   │
│   └── mock/                        # Mock data for Segment 2 Chat UI
│       └── chatData.ts              # Authentic primary source excerpts for UI demonstration
```

---

## 5. Development Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v22.23.0)
- **npm**: v9+ (tested on npm 10.9.8)

### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the landing page or [http://localhost:3000/chat](http://localhost:3000/chat) for the conversational interface.

### Running Quality Checks & Tests
```bash
# Run automated test suite (23 tests across 7 suites)
npm test

# Run TypeScript typechecking (strict mode, 0 errors)
npm run typecheck

# Run ESLint (0 errors, 0 warnings)
npm run lint

# Build for production
npm run build
```

---

## 6. Project Roadmap

- [x] **Segment 0: Project Foundation** (Fullstack architecture, core interfaces, configuration)
- [x] **Segment 1: Visual Identity & Landing Experience** (Academic dark/warm palette, design system)
- [x] **Segment 2: Chat Interface** (Conversational UI, empty state, source cards, evidence modal)
- [x] **Segment 3: Primary Source Architecture** (Canonical source/passage/provenance models, repositories, validation, test suite)
- [ ] **Segment 4: Document Ingestion Pipeline & Corpus Extractors** (BAWS Volumes 1–22, CAD transcripts)
- [ ] **Segment 5: Hybrid Retrieval & Search Indexing** (BM25 full-text + vector embeddings)
- [ ] **Segment 6: Evidence Scoring & Answer Generation Engine** (LLM synthesis strictly anchored in retrieved passages)
- [ ] **Segment 7: Verbatim Source Explorer** (Library browsing experience)
- [ ] **Segment 8: Multilingual Support** (Marathi, Hindi, Tamil, Telugu, etc.)
