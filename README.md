# AI Homework Chatbot

A client-side single-page app that lets students chat with an AI tutor for personalized, grade-appropriate homework help, and lets an admin curate a shared knowledge base that grounds the tutor's responses (RAG). No backend server — deployed as static files to GitHub Pages.

See [specs/001-ai-homework-chatbot/](specs/001-ai-homework-chatbot/) for the full spec, plan, and data model.

NOTE: This is mainly an experimentation.  I'm doing AI Engineer classes and I needed a platform to tryout a few things.  I opted for a learning platform with typescipt over Python just to tryout something different than most course using Python mainly beacuse I looking at embeding this in another project I'm working on which is the ScaleViewer.  Stay tune!

## Tech Stack

- Vite + TypeScript (vanilla, no UI framework)
- Google Gemini API (`gemini-1.5-flash` for chat, `embedding-001` for RAG embeddings)
- Firebase Firestore — shared knowledge base, embeddings, and admin config
- IndexedDB (via `idb`) — private, on-device student chat history

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
   - `GEMINI_API_KEY` — a Google Gemini API key.
   - `VITE_FIREBASE_*` — config values from a Firebase project with Cloud Firestore enabled (Project Settings → General → Your apps). Set Firestore rules to allow public reads and admin-gated writes on `knowledgeEntries`, `embeddingVectors`, and `appConfig`.

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open `http://localhost:5173`. Visit `/admin` to set the admin PIN on first use and manage the knowledge base.

## Build & Deploy

```bash
npm run build
```

Outputs static assets to `dist/`. Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds (injecting the `GEMINI_API_KEY` and `VITE_FIREBASE_*` repository secrets) and publishes to GitHub Pages. Add those secrets under **Settings → Secrets and variables → Actions** before the first deploy.

## Testing

```bash
npm test
```

Runs Vitest unit tests (`tests/unit/`) covering cosine similarity and PIN hashing.

## Validation

See [specs/001-ai-homework-chatbot/quickstart.md](specs/001-ai-homework-chatbot/quickstart.md) for the end-to-end scenarios (student homework flow, admin knowledge entry, RAG retrieval, conversation guardrails) and troubleshooting.
