# Data Model: AI Homework Chatbot

**Date**: 2026-09-19
**Feature**: AI Homework Chatbot

## Data Storage Strategy

| Data Category | Storage | Reason |
|---------------|---------|--------|
| Knowledge entries | **Firestore** (shared) | Must be accessible to all users across devices |
| Embedding vectors | **Firestore** (shared) | Tied to knowledge entries; needed for RAG on any device |
| Admin config (PIN, subjects) | **Firestore** (shared) | Admin settings must apply globally |
| Student sessions | **IndexedDB** (local) | Private to the student's device |
| Chat messages | **IndexedDB** (local) | Private to the student's device |
| Homework items | **IndexedDB** (local) | Ephemeral; part of chat session |

## Entity Overview

```
+---------------+       +------------------+       +------------------+
| StudentSession|------>|   ChatMessage    |       |  KnowledgeEntry  |
+---------------+       +------------------+       +------------------+
        |                                              |
        | 1:N                                          | 1:1
        v                                              v
+------------------+                          +------------------+
|  HomeworkItem    |                          |  EmbeddingVector |
+------------------+                          +------------------+
```

## Entities

### StudentSession *(IndexedDB)*

Represents an active interaction between a student and the chatbot. Stored locally on the device.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | UUID, PK | Unique session identifier |
| `gradeLevel` | `number` | 1–20, required | Selected grade level (standard numeric scale) |
| `subject` | `string` | required | Selected subject (predefined or custom) |
| `startedAt` | `number` | timestamp | Session start time (Unix ms) |
| `lastActiveAt` | `number` | timestamp | Last message timestamp |
| `performance` | `PerformanceSnapshot` | required | Running performance stats for adaptive difficulty |

**PerformanceSnapshot**:

| Field | Type | Description |
|-------|------|-------------|
| `consecutiveCorrect` | `number` | Streak of correct answers |
| `consecutiveIncorrect` | `number` | Streak of incorrect answers |
| `totalQuestions` | `number` | Total questions asked |
| `currentDifficulty` | `'easy' \| 'medium' \| 'hard'` | Adaptive difficulty level |

### ChatMessage *(IndexedDB)*

A single turn in the conversation. Stored locally on the device.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | UUID, PK | Unique message identifier |
| `sessionId` | `string` | FK → StudentSession.id | Parent session |
| `role` | `'student' \| 'assistant'` | required | Message sender |
| `content` | `string` | required | Message text |
| `timestamp` | `number` | timestamp | Message time (Unix ms) |
| `referencedEntryIds` | `string[]` | optional | Knowledge entries used in RAG for this response |
| `metadata` | `MessageMetadata` | optional | Additional generation context |

**MessageMetadata**:

| Field | Type | Description |
|-------|------|-------------|
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | Difficulty of generated question (if applicable) |
| `hintLevel` | `number` | Number of hints given for current question |
| `isHomeworkRequest` | `boolean` | Whether this message initiated a homework generation |

### KnowledgeEntry *(Firestore)*

A unit of educational content stored by an admin. Shared across all users.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | Auto-ID, PK | Firestore document ID |
| `subject` | `string` | required | Subject name (predefined or custom) |
| `gradeLevel` | `number` | 1–20, required | Target grade level |
| `title` | `string` | required | Short descriptive title |
| `contentBody` | `string` | required | Main educational text |
| `exampleProblems` | `ExampleProblem[]` | optional | Structured worked examples |
| `pedagogicalNotes` | `string` | optional | Teaching guidance for the AI |
| `attachments` | `Attachment[]` | optional | Images or diagrams (base64 data URLs) |
| `createdAt` | `Timestamp` | server timestamp | Creation time |
| `updatedAt` | `Timestamp` | server timestamp | Last update time |

**ExampleProblem**:

| Field | Type | Description |
|-------|------|-------------|
| `problem` | `string` | The problem statement |
| `solution` | `string` | Step-by-step solution |
| `explanation` | `string` | Conceptual explanation |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | Problem difficulty |

**Attachment**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique attachment ID |
| `mimeType` | `string` | e.g., `image/png`, `image/jpeg` |
| `dataUrl` | `string` | Base64-encoded image data (max 1MB per image) |
| `caption` | `string` | Optional description |

### EmbeddingVector *(Firestore, subcollection or separate collection)*

Cached embedding vector for a KnowledgeEntry, used for semantic retrieval. Shared across all users.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `entryId` | `string` | FK → KnowledgeEntry.id, PK | Links to knowledge entry |
| `model` | `string` | required | Embedding model name (e.g., `gemini-embedding-001`) |
| `vector` | `number[]` | required, length 3072 | Embedding vector components |
| `updatedAt` | `Timestamp` | server timestamp | When vector was last computed |

### HomeworkItem *(IndexedDB, ephemeral)*

A generated question delivered to the student. Embedded in ChatMessage metadata; not independently persisted.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `questionText` | `string` | required | The homework question |
| `expectedAnswerFormat` | `string` | required | Description of expected answer |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | required | Assigned difficulty |
| `subject` | `string` | required | Associated subject |
| `gradeLevel` | `number` | required | Target grade level |
| `hintText` | `string` | optional | Scaffolded hint |
| `explanationText` | `string` | optional | Full explanation to show after attempt |
| `solution` | `string` | optional | Correct answer/solution |

## Relationships

- **StudentSession 1:N ChatMessage**: A session contains many messages. (IndexedDB)
- **KnowledgeEntry 1:1 EmbeddingVector**: Each entry has at most one cached embedding vector. (Firestore)
- **ChatMessage N:M KnowledgeEntry**: A message may reference multiple knowledge entries via `referencedEntryIds`.

## Validation Rules

1. `gradeLevel` must be a positive integer between 1 and 20 inclusive.
2. `subject` must be non-empty and trimmed.
3. `KnowledgeEntry.contentBody` must be non-empty and at least 10 characters.
4. `Attachment.dataUrl` must be a valid base64 data URL under 1MB per image.
5. `EmbeddingVector.vector` length must match the expected dimension for the configured model (3072 for `gemini-embedding-001`).

## State Transitions

### StudentSession

```
[created] → [active] → [ended]
```

- **created**: Initial state when student selects grade/subject.
- **active**: Ongoing chat; transitions back to active on each message.
- **ended**: Session is archived (not deleted) after inactivity or explicit end.

### KnowledgeEntry

```
[draft] → [indexed] → [updated] → [indexed]
          → [deleted]
```

- **draft**: Entry saved but embedding not yet computed.
- **indexed**: Embedding vector computed and stored.
- **updated**: Content changed; embedding marked stale until re-computed.
- **deleted**: Entry removed from Firestore.

## Firestore Schema

### Collections

| Collection | Document ID | Fields |
|------------|-------------|--------|
| `knowledgeEntries` | Auto-ID | `subject`, `gradeLevel`, `title`, `contentBody`, `exampleProblems`, `pedagogicalNotes`, `attachments`, `createdAt`, `updatedAt` |
| `embeddingVectors` | `entryId` (matches knowledge entry) | `entryId`, `model`, `vector`, `updatedAt` |
| `appConfig` | `global` | `adminPinHash`, `customSubjects`, `predefinedSubjects` |

### Firestore Indexes

| Collection | Fields | Query Purpose |
|------------|--------|---------------|
| `knowledgeEntries` | `subject` (asc), `gradeLevel` (asc) | Filter by subject and grade |
| `knowledgeEntries` | `updatedAt` (desc) | List most recently updated entries |

## IndexedDB Schema (Object Stores)

| Store Name | Key Path | Indexes |
|------------|----------|---------|
| `studentSessions` | `id` | `startedAt` (non-unique) |
| `chatMessages` | `id` | `sessionId` (non-unique), `timestamp` (non-unique) |
| `appState` | `key` | — |

**AppState entries**:

| Key | Type | Description |
|-----|------|-------------|
| `lastSubject` | `string` | Last selected subject (UX convenience) |
| `lastGradeLevel` | `number` | Last selected grade level (UX convenience) |
