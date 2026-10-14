/**
 * Idempotent ingestion of curriculum knowledge entries + embedding vectors.
 *
 * Run from repo root with vite-node (handles TS + import.meta.env):
 *   npx vite-node scripts/ingest-knowledge.ts --probe-env
 *   npx vite-node scripts/ingest-knowledge.ts --dry-run
 *   npx vite-node scripts/ingest-knowledge.ts                # ingest (skips already-written entries)
 *   npx vite-node scripts/ingest-knowledge.ts --force        # re-ingest everything (re-embeds)
 *   npx vite-node scripts/ingest-knowledge.ts --verify
 *   npx vite-node scripts/ingest-knowledge.ts --probe --subject Mathematics --grade 5 --query "How do I compare fractions?"
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { doc, getDoc, getDocs, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { GEMINI_EMBEDDING_MODEL, WORKER_BASE_URL, isFirebaseConfigured } from '../src/config';
import { getDb, knowledgeEntriesCollection, embeddingVectorsCollection } from '../src/db/firebase';
import { embedText } from '../src/services/ai-orchestrator';
import { listKnowledgeEntriesBySubjectGrade } from '../src/db/knowledge';
import { getEmbeddingVectors } from '../src/db/vectors';
import { cosineSimilarity } from '../src/utils/cosine-similarity';
import {
  validateKnowledgeFile,
  type KnowledgeFile,
  type ContentEntry,
} from './lib/validate-knowledge-content';

const CONTENT_DIR = join(__dirname, '..', 'content', 'knowledge');
const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

function slug(subject: string): string {
  return subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function entryDocId(subject: string, gradeLevel: number): string {
  return `subj-${slug(subject)}-g${gradeLevel}`;
}

function loadFiles(): { file: string; data: KnowledgeFile }[] {
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: f, data: JSON.parse(readFileSync(join(CONTENT_DIR, f), 'utf8')) as KnowledgeFile }));
}

async function embedDocument(title: string, contentBody: string): Promise<{ vector: number[]; model: string }> {
  // Mirrors src/ui/admin/entry-editor.ts save path exactly.
  const text = `${title}\n${contentBody}`;
  for (let attempt = 1; ; attempt++) {
    try {
      return await embedText(text, 'document');
    } catch (err) {
      if (attempt >= 2) throw err;
      console.warn(`  embed failed (attempt ${attempt}), retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function ingestEntry(subject: string, e: ContentEntry, force: boolean): Promise<'written' | 'skipped' | 'failed'> {
  const id = entryDocId(subject, e.gradeLevel);
  const entryRef = doc(getDb(), 'knowledgeEntries', id);
  const vectorRef = doc(getDb(), 'embeddingVectors', id);
  try {
    if (!force) {
      const [entrySnap, vectorSnap] = await Promise.all([getDoc(entryRef), getDoc(vectorRef)]);
      if (entrySnap.exists() && vectorSnap.exists()) return 'skipped';
    }
    const { vector, model } = await embedDocument(e.title, e.contentBody);
    await setDoc(entryRef, {
      entryType: 'subject',
      subject,
      gradeLevel: e.gradeLevel,
      title: e.title,
      contentBody: e.contentBody,
      pedagogicalNotes: e.pedagogicalNotes,
      exampleProblems: e.exampleProblems,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(vectorRef, { entryId: id, model, vector, updatedAt: serverTimestamp() });
    return 'written';
  } catch (err) {
    console.error(`  FAILED ${id}: ${(err as Error).message}`);
    return 'failed';
  }
}

async function verify(): Promise<void> {
  const [entriesSnap, vectorsSnap] = await Promise.all([
    getDocs(knowledgeEntriesCollection()),
    getDocs(embeddingVectorsCollection()),
  ]);
  const vectorsById = new Map(vectorsSnap.docs.map((d) => [d.id, d.data()]));
  const bySubject = new Map<string, { grades: Set<number>; vectors: number; models: Set<string> }>();
  for (const d of entriesSnap.docs) {
    const data = d.data();
    if (data.entryType !== 'subject') continue;
    const row = bySubject.get(data.subject) ?? { grades: new Set<number>(), vectors: 0, models: new Set<string>() };
    row.grades.add(data.gradeLevel);
    const v = vectorsById.get(d.id);
    if (v) { row.vectors++; row.models.add(v.model); }
    bySubject.set(data.subject, row);
  }
  let total = 0;
  for (const subject of [...bySubject.keys()].sort()) {
    const row = bySubject.get(subject)!;
    total += row.grades.size;
    console.log(
      `${subject.padEnd(18)} ${row.grades.size}/20 grades  ${row.vectors} vectors  model=${[...row.models].join(',') || 'NONE'}`,
    );
  }
  console.log(`TOTAL: ${total}/160 entries`);
}

async function probe(subject: string, gradeLevel: number, query: string): Promise<void> {
  // Inline retrieval: src/services/rag.ts also touches IndexedDB (browser-only), so we
  // re-run its scoring pipeline here against Firestore directly.
  const entries = await listKnowledgeEntriesBySubjectGrade(subject, gradeLevel);
  const vectors = await getEmbeddingVectors(entries.map((e) => e.id));
  const { vector: qv, model } = await embedText(query, 'query');
  const ranked = vectors
    .filter((v) => v.model === model)
    .map((v) => {
      const entry = entries.find((e) => e.id === v.entryId);
      return entry ? { entry, score: cosineSimilarity(qv, v.vector) } : null;
    })
    .filter((r): r is { entry: (typeof entries)[number]; score: number } => r !== null && r.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  console.log(`Retrieval for "${query}" (subject=${subject}, grade=${gradeLevel}, model=${model}):`);
  if (ranked.length === 0) console.log('  NO RESULTS above MIN_SCORE 0.5');
  for (const r of ranked) console.log(`  ${r.score.toFixed(3)}  [g${r.entry.gradeLevel}] ${r.entry.title}`);
}

async function main(): Promise<void> {
  if (has('--probe-env')) {
    console.log(`WORKER_BASE_URL=${WORKER_BASE_URL ?? 'MISSING'} — ${WORKER_BASE_URL ? 'OK' : 'FAIL'}`);
    console.log(`Firebase configured: ${isFirebaseConfigured() ? 'OK' : 'FAIL'}`);
    process.exit(WORKER_BASE_URL && isFirebaseConfigured() ? 0 : 1);
  }

  const files = loadFiles();
  let entriesTotal = 0;
  let valid = true;
  for (const { file, data } of files) {
    const problems = validateKnowledgeFile(data);
    if (problems.length > 0) {
      valid = false;
      for (const pr of problems) console.error(`INVALID ${file} ${pr.path}: ${pr.message}`);
    } else {
      entriesTotal += data.entries.length;
      console.log(`OK ${file} — ${data.entries.length} entries (${data.subject})`);
    }
  }
  if (!valid) {
    console.error('Validation failed — nothing written.');
    process.exit(1);
  }
  console.log(`Validated ${files.length} files, ${entriesTotal} entries.`);

  if (has('--dry-run')) return;
  if (has('--verify')) return verify();
  if (has('--probe')) {
    return probe(opt('--subject')!, Number(opt('--grade')), opt('--query')!);
  }

  const force = has('--force');
  const counts = { written: 0, skipped: 0, failed: 0 };
  for (const { data } of files) {
    for (const e of data.entries) {
      const result = await ingestEntry(data.subject, e, force);
      counts[result]++;
      console.log(`${result.toUpperCase()}  subj-${slug(data.subject)}-g${e.gradeLevel}`);
      if (result === 'written') await new Promise((r) => setTimeout(r, 300)); // be kind to free-tier quotas
    }
  }
  console.log(`Ingested: ${counts.written} written, ${counts.skipped} skipped, ${counts.failed} failed.`);
  if (counts.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
