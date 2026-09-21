import { listKnowledgeEntriesBySubjectGrade } from '../db/knowledge';
import { getEmbeddingVectors } from '../db/vectors';
import { getCachedKnowledgeEntries, setCachedKnowledgeEntries } from '../db/local';
import { embedText } from './gemini';
import { cosineSimilarity } from '../utils/cosine-similarity';
import type { KnowledgeEntry, RetrievedEntry } from '../models/types';

const TOP_K = 3;
const MIN_SCORE = 0.5;

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

export function formatKnowledgeContext(results: RetrievedEntry[]): string | undefined {
  if (results.length === 0) return undefined;
  return results.map(({ entry }) => `Title: ${entry.title}\n${entry.contentBody}`).join('\n---\n');
}
