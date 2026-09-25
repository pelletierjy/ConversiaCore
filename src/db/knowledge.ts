import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type FirestoreError,
} from 'firebase/firestore';
import { getDb, knowledgeEntriesCollection } from './firebase';
import type { KnowledgeEntry } from '../models/types';

export interface KnowledgeEntryFilters {
  entryType?: 'subject' | 'context';
  subject?: string;
  gradeLevel?: number | null;
  contextKey?: string;
  isMainArticle?: boolean;
  searchQuery?: string;
}

type NewKnowledgeEntry = Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>;

export async function createKnowledgeEntry(entry: NewKnowledgeEntry): Promise<string> {
  const ref = await addDoc(knowledgeEntriesCollection(), {
    ...entry,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateKnowledgeEntry(id: string, entry: Partial<NewKnowledgeEntry>): Promise<void> {
  await updateDoc(doc(getDb(), 'knowledgeEntries', id), { ...entry, updatedAt: serverTimestamp() });
}

export async function deleteKnowledgeEntry(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'knowledgeEntries', id));
}

export async function listKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  const snapshot = await getDocs(query(knowledgeEntriesCollection(), orderBy('updatedAt', 'desc')));
  return snapshot.docs.map((d) => toKnowledgeEntry(d.id, d.data()));
}

export async function listKnowledgeEntriesWithFilters(
  filters: KnowledgeEntryFilters,
): Promise<KnowledgeEntry[]> {
  const conditions: QueryConstraint[] = [];
  const { entryType, subject, gradeLevel, contextKey, isMainArticle } = filters;

  if (entryType) {
    conditions.push(where('entryType', '==', entryType));
  }
  if (subject && entryType === 'subject') {
    conditions.push(where('subject', '==', subject));
  }
  if (gradeLevel != null && entryType === 'subject') {
    conditions.push(where('gradeLevel', '==', gradeLevel));
  }
  if (contextKey && entryType === 'context') {
    conditions.push(where('contextKey', '==', contextKey));
  }
  if (isMainArticle != null && entryType === 'context') {
    conditions.push(where('isMainArticle', '==', isMainArticle));
  }

  try {
    let snapshot;
    if (conditions.length > 0) {
      snapshot = await getDocs(
        query(knowledgeEntriesCollection(), ...conditions, orderBy('updatedAt', 'desc')),
      );
    } else {
      snapshot = await getDocs(query(knowledgeEntriesCollection(), orderBy('updatedAt', 'desc')));
    }

    let entries = snapshot.docs.map((d) => toKnowledgeEntry(d.id, d.data()));

    // Client-side search across title and content
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(searchLower) ||
          e.contentBody.toLowerCase().includes(searchLower) ||
          (e.subject && e.subject.toLowerCase().includes(searchLower)) ||
          (e.contextKey && e.contextKey.toLowerCase().includes(searchLower)),
      );
    }

    return entries;
  } catch (error) {
    const err = error as FirestoreError;
    // If index is missing, fall back to client-side filtering
    if (err.code === 'failed-precondition' && err.message.includes('index')) {
      console.warn('Falling back to client-side filtering due to missing composite index.');
      const allEntries = await listKnowledgeEntries();
      return applyClientFilters(allEntries, filters);
    }
    throw error;
  }
}

function applyClientFilters(entries: KnowledgeEntry[], filters: KnowledgeEntryFilters): KnowledgeEntry[] {
  return entries.filter((e) => {
    const { entryType, subject, gradeLevel, contextKey, isMainArticle, searchQuery } = filters;

    if (entryType && e.entryType !== entryType) return false;
    if (subject && e.entryType === 'subject' && e.subject !== subject) return false;
    if (gradeLevel != null && e.entryType === 'subject' && e.gradeLevel !== gradeLevel) return false;
    if (contextKey && e.entryType === 'context' && e.contextKey !== contextKey) return false;
    if (isMainArticle != null && e.entryType === 'context' && e.isMainArticle !== isMainArticle) return false;

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(searchLower) ||
        e.contentBody.toLowerCase().includes(searchLower) ||
        (e.subject && e.subject.toLowerCase().includes(searchLower)) ||
        (e.contextKey && e.contextKey.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });
}

export async function listKnowledgeEntriesBySubjectGrade(
  subject: string,
  gradeLevel: number,
): Promise<KnowledgeEntry[]> {
  const [gradeSnapshot, allGradesSnapshot] = await Promise.all([
    getDocs(
      query(knowledgeEntriesCollection(), where('subject', '==', subject), where('gradeLevel', '==', gradeLevel)),
    ),
    getDocs(
      query(knowledgeEntriesCollection(), where('subject', '==', subject), where('gradeLevel', '==', null)),
    ),
  ]);
  const seen = new Set<string>();
  const entries: KnowledgeEntry[] = [];
  for (const d of [...gradeSnapshot.docs, ...allGradesSnapshot.docs]) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    entries.push(toKnowledgeEntry(d.id, d.data()));
  }
  return entries;
}

/** All entries (main + sub-articles) sharing a host app's execution-context key, independent of subject/grade. */
export async function listContextEntries(contextKey: string): Promise<KnowledgeEntry[]> {
  const snapshot = await getDocs(query(knowledgeEntriesCollection(), where('contextKey', '==', contextKey)));
  return snapshot.docs.map((d) => toKnowledgeEntry(d.id, d.data()));
}

function toKnowledgeEntry(id: string, data: DocumentData): KnowledgeEntry {
  return {
    id,
    entryType: data.entryType ?? 'subject',
    subject: data.subject,
    gradeLevel: data.gradeLevel,
    contextKey: data.contextKey,
    isMainArticle: data.isMainArticle,
    title: data.title,
    contentBody: data.contentBody,
    exampleProblems: data.exampleProblems ?? [],
    pedagogicalNotes: data.pedagogicalNotes ?? '',
    attachments: data.attachments ?? [],
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
    updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),
  };
}
