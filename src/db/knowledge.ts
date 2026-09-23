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
} from 'firebase/firestore';
import { getDb, knowledgeEntriesCollection } from './firebase';
import type { KnowledgeEntry } from '../models/types';

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
