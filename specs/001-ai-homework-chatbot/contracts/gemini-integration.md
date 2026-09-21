# Contract: External Service Integrations

**Date**: 2026-09-19
**Feature**: AI Homework Chatbot

## Overview

The application integrates with two external managed services:
1. **Google Gemini API**: Content generation and text embeddings.
2. **Firebase Firestore**: Shared cloud database for the knowledge base and admin configuration.

---

## Gemini API Integration

### Authentication

- The API key is injected at build time via the `GEMINI_API_KEY` environment variable.
- The key is baked into the production bundle as a string constant.
- No runtime authentication flow is required for end users.

### Endpoints Used

#### Embedding Generation

- **Model**: `gemini-embedding-001` (verified against the live Gemini API on 2026-09-20; `embedding-001` has been retired)
- **Task Type**: `retrieval_document` (for knowledge entries), `retrieval_query` (for student queries)
- **Output Dimension**: 3072 (model default)
- **Rate Limit**: Subject to Gemini free tier / paid tier limits.

#### Content Generation

- **Model**: `gemini-flash-latest` (verified against the live Gemini API on 2026-09-20; `gemini-1.5-flash` has been retired)
- **Max Output Tokens**: 2048
- **Temperature**: 0.7 (balanced creativity and consistency)
- **System Prompt**: Constructed dynamically with retrieved knowledge context and student session parameters.

### Error Handling Contract

| Error Scenario | Application Behavior |
|----------------|---------------------|
| API key invalid or missing | Show admin configuration warning on startup; disable generation. |
| Rate limit exceeded (429) | Display user-friendly "too busy" message; suggest retry in 60 seconds. |
| Model unavailable (5xx) | Fall back to generic pedagogical response without RAG context. |
| Network timeout | Show connectivity error; allow retry. |
| Token limit exceeded | Truncate RAG context to fit within model window. |

---

## Firebase Firestore Integration

### Authentication

- Firestore is accessed via the Firebase Web SDK using anonymous or unauthenticated read access.
- Admin writes are protected by client-side PIN verification plus Firestore security rules.
- Firebase config values are injected at build time via `VITE_FIREBASE_*` environment variables.

### Collections Used

| Collection | Purpose | Access Pattern |
|------------|---------|----------------|
| `knowledgeEntries` | Shared educational content | Public read; admin-only write |
| `embeddingVectors` | Cached embeddings for RAG | Public read; admin-only write |
| `appConfig` | Global settings (PIN hash, subjects) | Public read; admin-only write |

### Error Handling Contract

| Error Scenario | Application Behavior |
|----------------|---------------------|
| Firebase config missing | Show setup instructions on startup. |
| Firestore rules blocking read | Display "data unavailable" message; prompt admin to check rules. |
| Firestore rules blocking write (admin) | Show permission error; advise admin to verify PIN and rules. |
| Network offline | Cache last-known knowledge entries in memory; warn user that content may be stale. |
| Document size limit exceeded (1MB) | Reject oversized image uploads in admin UI before sending to Firestore. |

### Data Privacy

- Student queries are sent to Gemini servers for processing.
- Knowledge base content is stored in Firebase Firestore (Google Cloud).
- No personally identifiable information (PII) is transmitted to either service.
- Student chat sessions and history remain device-local (IndexedDB) and are never sent to Firestore.
