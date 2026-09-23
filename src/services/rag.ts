import { listContextEntries, listKnowledgeEntriesBySubjectGrade } from '../db/knowledge';
import { getEmbeddingVectors } from '../db/vectors';
import {
  getCachedContextEntries,
  getCachedKnowledgeEntries,
  setCachedContextEntries,
  setCachedKnowledgeEntries,
} from '../db/local';
import { embedText } from './gemini';
import { cosineSimilarity } from '../utils/cosine-similarity';
import type { KnowledgeEntry, RetrievedEntry } from '../models/types';

const TOP_K = 3;
const MIN_SCORE = 0.5;
const CONTEXT_TOP_K = 2;

export async function retrieveRelevantEntries(
  subject: string,
  gradeLevel: number,
  queryText: string,
): Promise<RetrievedEntry[]> {
  let entries: KnowledgeEntry[];
  try {
    entries = await listKnowledgeEntriesBySubjectGrade(subject, gradeLevel);
    await setCachedKnowledgeEntries(subject, gradeLevel, entries);
  } catch {
    entries = await getCachedKnowledgeEntries(subject, gradeLevel);
  }

  if (entries.length === 0) return [];

  const vectors = await getEmbeddingVectors(entries.map((e) => e.id));
  if (vectors.length === 0) return [];

  const queryVector = await embedText(queryText, 'query');

  return vectors
    .map((v) => {
      const entry = entries.find((e) => e.id === v.entryId);
      return entry ? { entry, score: cosineSimilarity(queryVector, v.vector) } : null;
    })
    .filter((r): r is RetrievedEntry => r !== null && r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}

export interface ContextRetrievalResult {
  main?: KnowledgeEntry;
  relatedTitles: string[];
  related: RetrievedEntry[];
}

/** Fetches the main app-context article plus any of its sub-articles relevant to the current message. */
export async function retrieveContextEntries(contextKey: string, queryText: string): Promise<ContextRetrievalResult> {
  let entries: KnowledgeEntry[];
  try {
    entries = await listContextEntries(contextKey);
    await setCachedContextEntries(contextKey, entries);
  } catch {
    entries = await getCachedContextEntries(contextKey);
  }

  const main = entries.find((e) => e.isMainArticle);
  const subArticles = entries.filter((e) => !e.isMainArticle);
  const relatedTitles = subArticles.map((e) => e.title);

  if (subArticles.length === 0) return { main, relatedTitles, related: [] };

  const vectors = await getEmbeddingVectors(subArticles.map((e) => e.id));
  if (vectors.length === 0) return { main, relatedTitles, related: [] };

  const queryVector = await embedText(queryText, 'query');

  const related = vectors
    .map((v) => {
      const entry = subArticles.find((e) => e.id === v.entryId);
      return entry ? { entry, score: cosineSimilarity(queryVector, v.vector) } : null;
    })
    .filter((r): r is RetrievedEntry => r !== null && r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, CONTEXT_TOP_K);

  return { main, relatedTitles, related };
}

export function formatKnowledgeContext(results: RetrievedEntry[]): string | undefined {
  if (results.length === 0) return undefined;
  return results
    .map(({ entry }) => {
      const notes = entry.pedagogicalNotes?.trim();
      return `Title: ${entry.title}\n${entry.contentBody}${notes ? `\nPedagogical notes: ${notes}` : ''}`;
    })
    .join('\n---\n');
}
