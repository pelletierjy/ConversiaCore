import { getLocalDb } from './local';
import type { ChatMessage, StudentSession } from '../models/types';

export async function createSession(session: StudentSession): Promise<void> {
  const db = await getLocalDb();
  await db.put('studentSessions', session);
}

export async function updateSession(session: StudentSession): Promise<void> {
  const db = await getLocalDb();
  await db.put('studentSessions', session);
}

export async function getSession(id: string): Promise<StudentSession | undefined> {
  const db = await getLocalDb();
  return db.get('studentSessions', id);
}

export async function addMessage(message: ChatMessage): Promise<void> {
  const db = await getLocalDb();
  await db.put('chatMessages', message);
}

export async function getMessagesForSession(sessionId: string): Promise<ChatMessage[]> {
  const db = await getLocalDb();
  const messages = await db.getAllFromIndex('chatMessages', 'sessionId', sessionId);
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}
