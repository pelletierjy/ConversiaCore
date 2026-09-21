import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ChatMessage, KnowledgeEntry, StudentSession } from '../models/types';

interface AppSchema extends DBSchema {
  studentSessions: {
    key: string;
    value: StudentSession;
    indexes: { startedAt: number };
  };
  chatMessages: {
    key: string;
    value: ChatMessage;
    indexes: { sessionId: string; timestamp: number };
  };
  appState: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = 'ai-homework-chatbot';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AppSchema>> | null = null;

export function getLocalDb(): Promise<IDBPDatabase<AppSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<AppSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sessions = db.createObjectStore('studentSessions', { keyPath: 'id' });
        sessions.createIndex('startedAt', 'startedAt');

        const messages = db.createObjectStore('chatMessages', { keyPath: 'id' });
        messages.createIndex('sessionId', 'sessionId');
        messages.createIndex('timestamp', 'timestamp');

        db.createObjectStore('appState', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export async function getAppStateValue<T>(key: string): Promise<T | undefined> {
  const db = await getLocalDb();
  const entry = await db.get('appState', key);
  return entry?.value as T | undefined;
}

export async function setAppStateValue(key: string, value: unknown): Promise<void> {
  const db = await getLocalDb();
  await db.put('appState', { key, value });
}

function knowledgeCacheKey(subject: string, gradeLevel: number): string {
  return `knowledgeCache:${subject}:${gradeLevel}`;
}

/** Best-effort offline cache of the last knowledge entries fetched for a subject/grade pair. */
export async function getCachedKnowledgeEntries(subject: string, gradeLevel: number): Promise<KnowledgeEntry[]> {
  const cached = await getAppStateValue<{ entries: KnowledgeEntry[] }>(knowledgeCacheKey(subject, gradeLevel));
  return cached?.entries ?? [];
}

export async function setCachedKnowledgeEntries(
  subject: string,
  gradeLevel: number,
  entries: KnowledgeEntry[],
): Promise<void> {
  await setAppStateValue(knowledgeCacheKey(subject, gradeLevel), { entries, cachedAt: Date.now() });
}
