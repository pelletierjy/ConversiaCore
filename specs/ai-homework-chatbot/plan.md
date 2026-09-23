# Implementation Plan: AI Homework Chatbot

**Branch**: `[001-ai-homework-chatbot]` | **Date**: 2026-09-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-ai-homework-chatbot/spec.md`

## Summary

Build a client-side single-page web application deployable to GitHub Pages that serves two user roles: students who chat with an AI tutor to receive personalized homework, and admins who manage a shared cloud knowledge base of worked examples. The app uses the Google Gemini API for content generation and embeddings, stores the knowledge base in Firebase Firestore for cross-device sharing, performs client-side vector retrieval over fetched knowledge entries, persists student chat data locally on the user's device, and enforces conversation guardrails to keep student sessions focused on the selected academic subject.

## Technical Context

**Language/Version**: TypeScript 5.x (compiled to ES2022)

**Primary Dependencies**:
- Vite (build tool and dev server)
- `@google/generative-ai` (Gemini SDK for generation and embeddings)
- `firebase` (Firebase SDK for Firestore shared database)
- `idb` (IndexedDB wrapper for local student session/chat storage)
- `gh-pages` or GitHub Actions (deployment)

**Storage**:
- **Firebase Firestore**: Shared cloud database for knowledge entries, embedding vectors, and admin configuration (PIN hash, custom subjects). Accessible to all users across devices.
- **IndexedDB**: Local device storage for student chat sessions, chat messages, and homework history. Private to the device.

**Testing**: Vitest for unit tests; Playwright for end-to-end validation (optional).

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge) running on desktop and mobile.

**Project Type**: Single-page web application (frontend-only, static deployment).

**Performance Goals**: First contentful paint < 2s; first homework question generated within 10s of session start (per SC-001).

**Constraints**:
- No self-hosted backend infrastructure (per FR-008).
- Student chat data stays on device (per FR-009); knowledge base is shared via cloud DB.
- API key injected at build time via environment variable / GitHub Secret (per FR-010).
- Knowledge base limited to hundreds of entries to keep client-side vector search fast.

**Scale/Scope**: Multi-user read access to shared knowledge base; single-writer admin model (no concurrent edit conflict resolution required for v1).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project's `.specify/memory/constitution.md` is currently a template and does not contain ratified principles. No gates to enforce. Proceeding with standard web development best practices.

**Post-design note**: The specification was updated during planning to use a shared cloud database (Firebase Firestore) for the knowledge base, replacing the original all-local IndexedDB approach. This change was driven by the user requirement that admin-curated content must be accessible to all students across devices. Student chat data remains device-local per FR-009.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-homework-chatbot/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── main.ts              # Entry point, router, global styles
├── config.ts            # Build-time injected constants (API keys, model names, Firebase config)
├── db/
│   ├── firebase.ts      # Firebase initialization and Firestore references
│   ├── local.ts         # IndexedDB initialization and schema
│   ├── knowledge.ts     # Knowledge entry CRUD (Firestore)
│   ├── chat.ts          # Chat session and message storage (IndexedDB)
│   └── vectors.ts       # Embedding vector storage (Firestore) and retrieval
├── services/
│   ├── gemini.ts        # Gemini API wrapper (generation + embeddings)
│   ├── rag.ts           # Retrieval logic (fetch from Firestore + cosine similarity)
│   ├── homework.ts      # Homework generation orchestrator
│   └── guardrails.ts    # Conversation guardrails: off-topic detection + redirection
├── ui/
│   ├── app.ts           # Root app shell and routing
│   ├── chat/
│   │   ├── chat-view.ts
│   │   ├── message-list.ts
│   │   └── input-bar.ts
│   ├── admin/
│   │   ├── admin-view.ts
│   │   ├── login-form.ts
│   │   ├── entry-editor.ts
│   │   └── entry-list.ts
│   └── shared/
│       ├── grade-subject-selector.ts
│       └── toast.ts
├── models/
│   ├── types.ts         # Shared TypeScript interfaces
│   └── constants.ts     # Predefined subjects, grade levels, prompts
└── utils/
    ├── cosine-similarity.ts
    └── pin-hash.ts      # Simple PIN hashing for admin gate

public/
└── (static assets)

tests/
├── unit/
│   ├── cosine-similarity.test.ts
│   ├── rag.test.ts
│   └── pin-hash.test.ts
└── e2e/
    └── (Playwright tests)

.github/
└── workflows/
    └── deploy.yml       # Build + deploy to GitHub Pages
```

**Structure Decision**: Single-project frontend-only SPA. No self-hosted backend directory. Shared data lives in Firebase Firestore; all other logic runs in the browser. Build artifacts are deployed to GitHub Pages via GitHub Actions.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
