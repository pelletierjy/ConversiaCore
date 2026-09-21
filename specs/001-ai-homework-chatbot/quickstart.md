# Quickstart: AI Homework Chatbot

**Date**: 2026-09-19
**Feature**: AI Homework Chatbot

## Prerequisites

- Node.js 18+ and npm
- A Google Gemini API key (stored in `GEMINI_API_KEY` environment variable or GitHub Secret)
- A Firebase project with Firestore enabled
- A modern web browser (Chrome, Firefox, Safari, Edge)

## Firebase Setup

1. **Create a Firebase project**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Create a new project.
   - Enable **Cloud Firestore** in Native mode.
   - Set Firestore security rules to allow read access and authenticated admin writes (see `firestore.rules` in repo).

2. **Get Firebase config**:
   - Go to **Project Settings** → **General** → **Your apps**.
   - Register a web app and copy the config object.

3. **Add Firebase config to environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add:
   # GEMINI_API_KEY=your_gemini_key
   # VITE_FIREBASE_API_KEY=...
   # VITE_FIREBASE_AUTH_DOMAIN=...
   # VITE_FIREBASE_PROJECT_ID=...
   # VITE_FIREBASE_STORAGE_BUCKET=...
   # VITE_FIREBASE_MESSAGING_SENDER_ID=...
   # VITE_FIREBASE_APP_ID=...
   ```

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

3. **Open the app**:
   - Navigate to `http://localhost:5173`.
   - Select a grade level and subject, then start chatting.
   - To access the admin panel, navigate to `/admin` and set a PIN on first visit.

## Build for Production

```bash
npm run build
```

Static assets are emitted to the `dist/` directory, ready for GitHub Pages deployment.

## Deploy to GitHub Pages

1. **Add secrets to repository**:
   - Go to **Settings → Secrets and variables → Actions** in your GitHub repository.
   - Add secrets for `GEMINI_API_KEY` and all `VITE_FIREBASE_*` values.

2. **Push to `main`**:
   - The `.github/workflows/deploy.yml` action will build and deploy automatically.
   - The site will be live at `https://<username>.github.io/<repo-name>/`.

## End-to-End Validation Scenarios

### Scenario A: Student Receives Homework

1. Open the app in a browser.
2. Select **Grade 9** and **Mathematics**.
3. Type: "Give me a homework problem."
4. **Expected outcome**: The chatbot responds with a grade-appropriate math problem within 10 seconds.
5. Submit an answer.
6. **Expected outcome**: The chatbot indicates correctness and provides an explanation or follow-up question.

### Scenario B: Admin Adds Knowledge Entry

1. Navigate to the **Admin** page (`/admin`).
2. Enter the admin PIN (set on first visit).
3. Click **Add Entry**.
4. Fill in:
   - Subject: `Mathematics`
   - Grade Level: `9`
   - Title: `Quadratic Equations Intro`
   - Content: A brief explanation of quadratic equations.
5. Click **Save**.
6. **Expected outcome**: The entry appears in the knowledge base list.
7. Open the app in a **different browser/incognito window**.
8. Start a student session and request a math problem.
9. **Expected outcome**: The generated problem references the newly added entry (proving cross-device sharing works).

### Scenario C: RAG Retrieval Verification

1. Ensure the knowledge base contains at least one entry for **Physics Grade 10** about "Newton's Laws."
2. Start a student session with **Grade 10 Physics**.
3. Ask: "Help me understand forces."
4. **Expected outcome**: The chatbot's explanation references Newton's Laws and uses language consistent with the knowledge entry.

### Scenario D: Conversation Guardrails

1. Start a student session with **Grade 8 Mathematics**.
2. Type: "Tell me about the latest video games."
3. **Expected outcome**: The chatbot does not engage with the off-topic request. Instead, it politely redirects the student back to math homework (e.g., "Let's focus on your math practice. Would you like a problem about fractions?").
4. Type: "What's your favorite movie?"
5. **Expected outcome**: The chatbot again redirects back to the academic subject without answering the off-topic question.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "API key not configured" on startup | `GEMINI_API_KEY` missing from `.env` or build | Add the key to `.env` and restart dev server. |
| "Firebase not configured" on startup | Firebase config values missing | Add all `VITE_FIREBASE_*` variables to `.env`. |
| Chatbot responds with generic content | Knowledge base empty or embeddings not computed | Add knowledge entries and ensure they show as "Indexed." |
| Admin page inaccessible | PIN not set or forgotten | Manually update the `adminPinHash` field in Firestore `appConfig/global` document (development only). |
| Slow response times | Large knowledge base or network latency | Check browser console for API timing; reduce knowledge base size if needed. |
| Cross-device sharing not working | Firestore rules blocking reads | Update Firestore security rules to allow public read access to `knowledgeEntries` and `embeddingVectors`. |
