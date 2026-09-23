# Tasks: AI Homework Chatbot

**Input**: Design documents from `/specs/001-ai-homework-chatbot/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Vite project with TypeScript in repository root
- [X] T002 Install production dependencies (`firebase`, `@google/generative-ai`, `idb`) via npm
- [X] T003 Install dev dependencies (`vitest`, `playwright`, `typescript`, `@types/node`) via npm
- [X] T004 Create `.env.example` with all required build-time variables (`GEMINI_API_KEY`, `VITE_FIREBASE_*`)
- [X] T005 [P] Create source directory structure (`src/`, `src/db/`, `src/services/`, `src/ui/chat/`, `src/ui/admin/`, `src/ui/shared/`, `src/models/`, `src/utils/`, `tests/unit/`, `tests/e2e/`, `.github/workflows/`)
- [X] T006 Create `.github/workflows/deploy.yml` for GitHub Actions → GitHub Pages build and deploy

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 [P] Create `src/config.ts` with build-time injected constants (Gemini API key, model names, Firebase config)
- [X] T008 [P] Create `src/models/types.ts` with all shared TypeScript interfaces (StudentSession, ChatMessage, KnowledgeEntry, EmbeddingVector, HomeworkItem, etc.)
- [X] T009 [P] Create `src/models/constants.ts` with predefined subjects, grade levels, and LLM system prompts
- [X] T010 Create `src/db/firebase.ts` for Firestore initialization and collection references
- [X] T011 Create `src/db/local.ts` for IndexedDB initialization, schema creation, and store references
- [X] T012 [P] Create `src/utils/cosine-similarity.ts` for vector similarity computation
- [X] T013 [P] Create `src/utils/pin-hash.ts` for PIN hashing and verification using `crypto.subtle`
- [X] T014 Create `src/services/gemini.ts` for Gemini API wrapper (content generation and embedding generation)

**Checkpoint**: Foundation ready — config, models, DB connections, utilities, and external API wrapper are all in place. User story implementation can now begin.

---

## Phase 3: User Story 1 - Student Requests Personalized Homework (Priority: P1) 🎯 MVP

**Goal**: A student can select a grade level and subject, then chat with the AI tutor to receive personalized homework questions, hints, and explanations in an open-ended session.

**Independent Test**: Open the app, select Grade 9 Mathematics, ask for homework, submit an answer, and receive feedback/hints within 10 seconds.

### Implementation for User Story 1

- [X] T015 [P] [US1] Create `src/ui/shared/grade-subject-selector.ts` for grade and subject selection UI
- [X] T016 [P] [US1] Create `src/db/chat.ts` for local IndexedDB chat session and message CRUD
- [X] T017 [US1] Create `src/services/guardrails.ts` for conversation guardrails (off-topic detection and polite redirection)
- [X] T018 [US1] Create `src/services/homework.ts` for homework generation orchestrator (adaptive difficulty, hint generation, answer evaluation via LLM)
- [X] T019 [P] [US1] Create `src/ui/chat/chat-view.ts` for the main chat interface container
- [X] T020 [P] [US1] Create `src/ui/chat/message-list.ts` for rendering chat messages (student and assistant)
- [X] T021 [P] [US1] Create `src/ui/chat/input-bar.ts` for student message input and send action
- [X] T022 [US1] Create `src/ui/app.ts` for root app shell, view routing, and global layout
- [X] T023 [US1] Wire up student chat flow end-to-end in `src/main.ts` (selector → chat → homework generation → message rendering)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. A student can select grade/subject, chat, receive homework, get hints, and see answer feedback.

---

## Phase 4: User Story 2 - Administrator Builds Knowledge Base (Priority: P2)

**Goal**: An admin can access a protected interface to add, view, edit, and delete knowledge base entries organized by subject and grade level, with content stored in the shared Firestore database.

**Independent Test**: Navigate to `/admin`, enter PIN, add a knowledge entry for Grade 9 Mathematics, verify it appears in the entry list, then open the app in a different browser and confirm the entry is visible.

### Implementation for User Story 2

- [X] T024 [P] [US2] Create `src/db/knowledge.ts` for Firestore knowledge entry CRUD operations
- [X] T025 [P] [US2] Create `src/db/vectors.ts` for Firestore embedding vector storage and retrieval
- [X] T026 [US2] Create `src/ui/admin/login-form.ts` for admin PIN entry and verification UI
- [X] T027 [P] [US2] Create `src/ui/admin/entry-list.ts` for browsing, searching, and deleting knowledge entries
- [X] T028 [P] [US2] Create `src/ui/admin/entry-editor.ts` for adding and editing knowledge entries (including image attachment handling)
- [X] T029 [US2] Create `src/ui/admin/admin-view.ts` for admin page shell and navigation
- [X] T030 [US2] Wire up admin knowledge management flow end-to-end (PIN gate → CRUD → Firestore sync)
- [X] T031 [US2] Add admin PIN setup and verification flow integrated with Firestore `appConfig/global` document

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Admins can manage the knowledge base and students can receive homework.

---

## Phase 5: User Story 3 - Student Receives Contextually Enriched Responses (Priority: P3)

**Goal**: The chatbot retrieves relevant examples from the shared knowledge base to ground its homework generation in curriculum-aligned material, with client-side vector similarity search.

**Independent Test**: Add a knowledge entry about quadratic equations for Grade 9. Start a Grade 9 Math session and request homework. Verify the generated problem references concepts or style from the knowledge entry.

### Implementation for User Story 3

- [X] T032 [US3] Create `src/services/rag.ts` for retrieval logic (fetch knowledge entries by subject/grade from Firestore, compute cosine similarity with query embedding, return top matches)
- [X] T033 [US3] Integrate RAG retrieval into `src/services/homework.ts` (inject retrieved knowledge context into LLM prompts)
- [X] T034 [US3] Add client-side knowledge base cache in `src/db/local.ts` or `src/db/vectors.ts` for offline resilience and stale-data handling
- [X] T035 [US3] Wire up RAG retrieval end-to-end: student asks for homework → RAG fetches relevant entries → LLM generates contextually enriched response

**Checkpoint**: All user stories should now be independently functional. The chatbot uses the knowledge base to enrich responses.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T036 [P] Add responsive CSS styling and global theme (`src/main.ts` or dedicated stylesheet)
- [X] T037 [P] Add error handling, loading states, and toast notifications across `src/ui/` components
- [X] T038 [P] Add client-side rate-limiting and API error fallback handling in `src/services/gemini.ts`
- [X] T039 Create `README.md` with setup, Firebase configuration, and deployment instructions
- [X] T040 Run `quickstart.md` validation scenarios (Scenarios A–D) end-to-end
- [X] T041 Verify all functional requirements FR-001 through FR-011 are implemented and working

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - User stories should proceed sequentially in priority order (P1 → P2 → P3)
  - US3 depends on US2 because RAG requires knowledge entries to exist in Firestore
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — Independent of US1, but shares Firestore connection
- **User Story 3 (P3)**: Can start after US2 (P2) is complete — Requires knowledge entries and embedding vectors in Firestore for RAG to function

### Within Each User Story

- Models/DB layer before services
- Services before UI components
- Core implementation before end-to-end wiring
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- T015, T016, T019, T020, T021 (US1 UI and local DB) can run in parallel
- T024, T025, T026, T027, T028 (US2 DB and admin UI) can run in parallel
- T032 and T034 (US3 RAG service and cache) can run in parallel
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all UI models and local DB for User Story 1 together:
Task: "Create src/ui/shared/grade-subject-selector.ts"
Task: "Create src/db/chat.ts"

# Launch all chat UI components together:
Task: "Create src/ui/chat/chat-view.ts"
Task: "Create src/ui/chat/message-list.ts"
Task: "Create src/ui/chat/input-bar.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (student can chat and receive homework)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Complete Polish phase → Final validation → Deploy
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (student chat)
   - Developer B: User Story 2 (admin knowledge base)
3. After US2 completes:
   - Developer C: User Story 3 (RAG enrichment)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
