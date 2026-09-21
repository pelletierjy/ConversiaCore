# Research: AI Homework Chatbot

**Date**: 2026-09-19
**Feature**: AI Homework Chatbot

## Technical Decisions

### 1. Client-Side Architecture (No Backend)

**Decision**: Build a pure frontend SPA deployed to GitHub Pages.

**Rationale**:
- Requirement FR-008 explicitly mandates "standalone client-side application without requiring backend infrastructure."
- GitHub Pages only serves static files; no server-side execution is available.
- Simplifies deployment and eliminates hosting costs.

**Alternatives considered**:
- Lightweight backend (Cloudflare Workers, Vercel Functions): Rejected because it violates FR-008 and introduces operational complexity.
- Serverless database (Firebase, Supabase): Rejected because it violates FR-009 (data must remain on device).

### 2. Build Tool: Vite

**Decision**: Use Vite for development and production builds.

**Rationale**:
- Fast dev server with hot module replacement.
- First-class TypeScript support without complex configuration.
- Easy environment variable injection for the Gemini API key at build time.
- Generates optimized static assets suitable for GitHub Pages.

**Alternatives considered**:
- Parcel: Rejected in favor of Vite's faster cold starts and simpler config.
- Create React App / Next.js: Rejected because no React framework is needed; vanilla TS is sufficient and keeps bundle size smaller.
- No build tool (plain HTML/JS): Rejected because TypeScript and module bundling significantly improve maintainability.

### 3. Language: TypeScript (Vanilla, No UI Framework)

**Decision**: Use vanilla TypeScript with native Web Components or template-based DOM manipulation.

**Rationale**:
- Keeps bundle size minimal for fast loads on GitHub Pages.
- No framework learning curve for a focused two-view app (chat + admin).
- TypeScript provides type safety without runtime overhead.
- The UI is simple enough (forms, chat bubbles, lists) that a framework is unnecessary.

**Alternatives considered**:
- React/Vue/Svelte: Rejected to avoid framework boilerplate and larger bundles for a simple SPA.
- Plain JavaScript: Rejected because TypeScript catches errors early and improves refactoring confidence.

### 4. Storage: Firebase Firestore + IndexedDB (Hybrid)

**Decision**: Use Firebase Firestore for the shared knowledge base and embedding vectors, and IndexedDB (via `idb` wrapper) for private student chat sessions.

**Rationale**:
- The knowledge base must be shared across devices so that a remote admin can curate content for all students.
- Firebase Firestore provides a managed NoSQL database with a client-side SDK that works directly from static GitHub Pages deployments.
- Student chat history is private and device-specific, so it stays in IndexedDB (per FR-009).
- Firestore real-time sync ensures new knowledge entries are immediately available to all users.

**Alternatives considered**:
- Supabase: Rejected because Firebase's client SDK is simpler for anonymous/public read access without auth backend setup.
- IndexedDB only: Rejected because it cannot share data across devices.
- GitHub API as database (JSON files in repo): Rejected because write latency is too high and requires exposing a GitHub token in the client.
- localStorage: Rejected due to ~5MB limit and lack of structured query support.

### 5. Local Storage: IndexedDB (Student Data)

**Decision**: Use IndexedDB (via `idb` wrapper) for student chat sessions and messages.

**Rationale**:
- Requirement FR-009 mandates student data remains on the user's device.
- IndexedDB supports structured objects and larger storage quotas than localStorage.
- `idb` package provides a Promise-based API that is ergonomic for async/await.

**Alternatives considered**:
- Firestore for everything: Rejected because storing student chat history in the cloud raises privacy concerns and violates the student-data-local principle.
- localStorage: Rejected due to ~5MB limit.
- In-memory only: Rejected because data would be lost on page refresh.

### 6. Vector Retrieval: Client-Side Cosine Similarity over Firestore Data

**Decision**: Store embedding vectors in Firestore alongside knowledge entries. At query time, fetch entries filtered by subject/grade, download their vectors, and perform brute-force cosine similarity search in JavaScript.

**Rationale**:
- The knowledge base is expected to be small (hundreds of entries per spec assumptions).
- Brute-force cosine similarity over a filtered subset (tens to low-hundreds of vectors) is computationally trivial in modern browsers.
- Firestore stores the shared vectors; no external vector database service is needed.
- Metadata filtering (subject + grade level) happens in Firestore before client-side semantic ranking.

**Alternatives considered**:
- Pinecone/Weaviate/Qdrant: Rejected because they require backend infrastructure and network calls.
- `usearch` / `faiss-js`: Rejected because brute-force search is sufficient for the data volume and avoids WASM/native module dependencies.
- Keyword/TF-IDF search: Rejected because semantic search (embeddings) provides better retrieval quality for RAG.

### 6. Embeddings: Gemini Embedding API

**Decision**: Use Google's `embedding-001` model via the Gemini API for generating text embeddings.

**Rationale**:
- The app already uses Gemini for content generation; using the same provider simplifies credentials and billing.
- `embedding-001` supports up to 2048 dimensions and performs well for semantic search.
- Free tier available, keeping costs low during development.

**Alternatives considered**:
- OpenAI `text-embedding-3-small`: Rejected to avoid managing a second API provider and credential.
- transformers.js (client-side model): Rejected because it adds significant WASM/binary payload (~50MB+) and slower inference compared to a lightweight API call.

### 7. LLM Generation: Gemini Pro

**Decision**: Use `gemini-1.5-flash` for homework generation (fast, cost-effective) with a system prompt that grounds responses using retrieved knowledge.

**Rationale**:
- `flash` is optimized for low latency and high throughput, aligning with SC-001 (10-second response target).
- Sufficient quality for structured homework generation.
- Same API key and SDK as embeddings.

**Alternatives considered**:
- `gemini-1.5-pro`: Rejected as overkill for homework questions; higher cost and latency.
- OpenAI GPT-4o: Rejected to avoid a second provider.

### 8. Image Handling in Knowledge Entries

**Decision**: Store images as base64 strings in Firestore alongside knowledge entries. Display them inline in the admin UI and reference them in prompts (if the model supports multimodal input).

**Rationale**:
- Clarification Q5 specified "plain text with optional image or diagram attachments."
- Firestore documents can store base64 strings up to 1MB per document (Firestore limit is ~1MB per document, so images must be small).
- Gemini 1.5 Flash supports image input, so diagrams can be included in generation prompts if needed.
- Base64 storage keeps images within the shared knowledge base without external hosting.

**Alternatives considered**:
- Firebase Storage: Rejected to avoid a second Firebase service and complexity; base64 in Firestore is sufficient for small diagrams.
- External image hosting: Rejected to avoid dependency on external image services.
- IndexedDB only: Rejected because images must be shared across devices.

### 9. Admin PIN Protection

**Decision**: Store a hashed PIN in Firestore (`appConfig/global` document). Use PBKDF2 or a simple salted hash for verification. No encryption library required.

**Rationale**:
- Clarification Q1 specified "simple PIN or password protects the admin interface."
- Since the PIN must be consistent across devices (so any admin can log in from any device), it is stored in the shared Firestore database.
- Browser-native `crypto.subtle` provides PBKDF2 for secure hashing without external dependencies.
- The PIN hash is not sensitive credentials (it only gates UI access, not API access).

**Alternatives considered**:
- No PIN (landing page only): Rejected per clarification.
- Full JWT/session auth: Rejected because there is no backend to issue or verify tokens.
- PIN in IndexedDB: Rejected because it would require re-setting the PIN on every device.

### 10. Deployment: GitHub Actions → GitHub Pages

**Decision**: Use a GitHub Actions workflow that builds the Vite app (injecting `GEMINI_API_KEY` from repository secrets) and deploys to the `gh-pages` branch.

**Rationale**:
- User explicitly requested the app "run straight in the repo's GitHub page."
- GitHub Actions is the standard CI/CD tool for GitHub repositories.
- Environment variables/secrets are securely injected at build time and baked into the static output.

**Caveat**: Because the app is client-side, the API key will be present in the built JavaScript bundle. This is an inherent limitation of static frontend apps calling paid APIs directly. Rate limits and monitoring on the Gemini console are the primary mitigation.

**Alternatives considered**:
- Manual deployment to gh-pages branch: Rejected because it is error-prone and lacks secret injection.
- Netlify/Vercel: Rejected per user request for GitHub Pages.

### 11. Conversation Guardrails

**Decision**: Implement conversation guardrails via the LLM system prompt, reinforced by a lightweight client-side keyword filter for obvious off-topic cases.

**Rationale**:
- Requirement FR-011 mandates the chatbot keep conversations focused on the selected subject and homework goal.
- A strong system prompt instruction ("You are a tutor for [subject]. Stay on topic. Politely redirect off-topic requests.") is the primary defense.
- A lightweight client-side keyword/phrase check can catch obvious distractions (e.g., gaming, social media references) before sending to the API, reducing token usage.
- Combining both layers provides robust guardrails without needing a separate moderation API.

**Alternatives considered**:
- Dedicated moderation API (e.g., OpenAI Moderation, Perspective API): Rejected to avoid a third-party dependency and additional latency/cost.
- Purely client-side rule engine: Rejected because rule-based systems are brittle and miss nuanced off-topic drift; the LLM itself is better at contextual judgment.
- No guardrails: Rejected because it violates FR-011.
