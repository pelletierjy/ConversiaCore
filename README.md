# ConversiaCore

An embeddable AI tutor service and general knowledge base for multi-host applications.

ConversiaCore is an AI-powered tutoring widget that can be dropped into any host web application as the `<conversia-app>` custom element. It provides personalized, grade-appropriate homework help grounded in a shared, admin-curated knowledge base (RAG — Retrieval-Augmented Generation).

Each host application identifies itself with a `context` attribute, which drives per-host behavior:

- **Per-host system prompts** — each host app gets its own tutoring personality, subject matter, and pedagogical instructions
- **Host-specific guardrails** — off-topic keyword filtering and redirect messages tailored to each host
- **Host command tools** — the AI can directly invoke actions on the host app (e.g., switch scales/instruments on a music visualization app) via Gemini function calling
- **Context-scoped knowledge base** — knowledge entries can be tagged to specific host applications

**Host applications:**

- [ScalesViewer](https://github.com/pelletierjy/ScalesViewer) — music theory tutor embedded in an interactive scale visualization tool (guitar, piano, flute, kalimba, harmonica, recorder)
- [HomeworkTutora](https://github.com/pelletierjy/HomeworkTutora) — Angular-based AI homework helper for students

**🌐 Try it live:** https://pelletierjy.github.io/ConversiaCore/

## Embedding

Drop the built widget into any web page:

```html
<script type="module" src="https://pelletierjy.github.io/conversia-core/conversia-core-widget.js"></script>
<conversia-app context="ScalesViewer" subject="Music" grade-level="20"></conversia-app>
```

Attributes:

| Attribute | Description |
|---|---|
| `context` | Host app's execution-context key (e.g. `"ScalesViewer"`, `"HomeworkTutora"`). Drives per-host prompt, guardrails, knowledge scope, and available host commands. |
| `subject` | Forces the subject, skipping the subject picker. |
| `grade-level` | Forces the grade level (1–20), skipping the grade-level picker. |
| `theme` | `"light"` or `"dark"` (updates live, no re-render). |
| `lang` | `"en"`, `"fr"`, or `"es"` (re-renders in place; keeps the session). |

Changing `subject`, `grade-level`, or `context` restarts the flow with a new session. The widget dispatches `conversia-app:command` `CustomEvent`s (bubbling, composed) that host apps listen for to react to AI-initiated state changes. See `src/models/host-commands.ts` for the command protocol.

## Tech Stack

- Vite + TypeScript (vanilla, no UI framework)
- Multi-provider AI with automatic fallback: Google Gemini (primary), Groq and OpenRouter (fallback)
- Cloudflare Worker proxy (see `worker/`) — manages API keys, token budgeting, and provider failover
- Firebase Firestore — shared knowledge base, embeddings, and admin config (per-host system prompts & guardrails)
- IndexedDB (via `idb`) — private, on-device student chat history
- RAG embeddings via Gemini `gemini-embedding-001` (3072-dim vectors, cosine similarity)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in:
   - `GEMINI_API_KEY` — a Google Gemini API key
   - `GROQ_API_KEY` — a Groq API key (fallback chat provider; free tier — see https://console.groq.com)
   - `OPENROUTER_API_KEY` — an OpenRouter API key (fallback chat provider; free tier — see https://openrouter.ai/keys)
   - `VITE_WORKER_BASE_URL` — your Cloudflare Worker URL
   - `VITE_FIREBASE_*` — config values from a Firebase project with Cloud Firestore enabled (Project Settings → General → Your apps). Set Firestore rules to allow public reads and admin-gated writes on `knowledgeEntries`, `embeddingVectors`, `appConfig`, and `hostAppConfigs`.

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open `http://localhost:5173`. Visit `/admin` to set the admin PIN on first use and manage the knowledge base and host app configurations.

## Build & Deploy

```bash
npm run build
```

Outputs static assets to `dist/`:

- `dist/conversia-core/` — standalone SPA index + assets (hosted on GitHub Pages)
- `dist/conversia-core-widget.js` — self-registering ES module for embedding in host apps (built after the main `vite build` so it doesn't wipe that output; see `vite.config.widget.ts`)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds (injecting `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, and `VITE_FIREBASE_*` repository secrets) and publishes to GitHub Pages. Add those secrets under **Settings → Secrets and variables → Actions** before the first deploy.

## Admin: Host Apps Configuration

Each host app's system prompt and guardrails are configured through the admin UI (`/admin` → "Host Apps" tab) and stored in Firestore at `appConfig/{contextKey}`. An administrator adds a configuration document for each application that embeds ConversiaCore, specifying the host's system prompt, off-topic keywords, and redirect message.

## Testing

```bash
npm test
```

Runs Vitest unit tests (`tests/unit/`) covering cosine similarity and PIN hashing.

## Validation

See `specs/` for end-to-end scenarios (student homework flow, admin knowledge entry, RAG retrieval, conversation guardrails) and troubleshooting.