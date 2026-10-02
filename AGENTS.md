<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ask Ambedkar — Development & Coding Conventions

## Core Invariants
1. **Primary Sources Only**: Only primary materials directly attributable to Dr. B. R. Ambedkar (books, speeches, interviews, Constituent Assembly debates, letters, editorials). Never introduce secondary commentaries as evidence.
2. **Never Invent Opinions**: If documented writings do not establish Ambedkar's position, the system must explicitly communicate that no sufficient documented evidence exists. Never speculate or extrapolate what Ambedkar "would have thought."
3. **Decoupled Domain Logic**: All business logic lives in `src/core/`. Modules in `src/core/` must remain pure TypeScript and framework-agnostic (do not import React, Next.js server components, or HTTP headers inside `src/core/`).
4. **Strict Typing**: All modules must compile with zero errors under TypeScript strict mode.
5. **Vanilla CSS Design System**: Use Vanilla CSS with CSS custom properties and `@layer`. Avoid adding utility-first frameworks like Tailwind unless explicitly instructed.
6. **No Fake Data**: Do not populate mock or hallucinated knowledge bases. Ingestion pipelines and vector stores are to be built systematically in dedicated segments.

