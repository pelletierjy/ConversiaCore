import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from './firebase';
import type { EmbeddingVector } from '../models/types';

export async function saveEmbeddingVector(entryId: string, model: string, vector: number[]): Promise<void> {
  await setDoc(doc(getDb(), 'embeddingVectors', entryId), {
    entryId,
    model,
    vector,
    updatedAt: serverTimestamp(),
  });
}

export async function getEmbeddingVector(entryId: string): Promise<EmbeddingVector | undefined> {
  const snap = await getDoc(doc(getDb(), 'embeddingVectors', entryId));
  if (!snap.exists()) return undefined;
  const data = snap.data();
  return {
    entryId,
    model: data.model,
    vector: data.vector,
    updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),
  };
}

export async function getEmbeddingVectors(entryIds: string[]): Promise<EmbeddingVector[]> {
  const results = await Promise.all(entryIds.map((id) => getEmbeddingVector(id)));
  return results.filter((v): v is EmbeddingVector => Boolean(v));
}

export async function deleteEmbeddingVector(entryId: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'embeddingVectors', entryId));
}
