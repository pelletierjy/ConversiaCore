import { buildTutorSystemPrompt } from '../models/constants';
import { generateTutorResponse, type ChatTurn } from './gemini';
import { isLikelyOffTopic, buildRedirectMessage } from './guardrails';
import { formatKnowledgeContext, retrieveRelevantEntries } from './rag';
import { getLocale, LOCALE_LANGUAGE_NAMES } from '../i18n/locale';
import type { Difficulty, PerformanceSnapshot } from '../models/types';

const TAG_PATTERN = /^\[(HOMEWORK|CORRECT|INCORRECT|INFO)\]\s*/i;
const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

export interface HomeworkTurnResult {
  reply: string;
  performance: PerformanceSnapshot;
  isHomeworkRequest: boolean;
  referencedEntryIds: string[];
}

function nextDifficulty(current: Difficulty, correct: boolean): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  return correct
    ? DIFFICULTY_ORDER[Math.min(idx + 1, DIFFICULTY_ORDER.length - 1)]
    : DIFFICULTY_ORDER[Math.max(idx - 1, 0)];
}

/** Sends a student message to the tutor LLM and updates adaptive performance state. */
export async function sendStudentMessage(params: {
  subject: string;
  gradeLevel: number;
  performance: PerformanceSnapshot;
  history: ChatTurn[];
  message: string;
  knowledgeContext?: string;
}): Promise<HomeworkTurnResult> {
  const { subject, gradeLevel, performance, history, message } = params;

  if (isLikelyOffTopic(message)) {
    return { reply: buildRedirectMessage(subject), performance, isHomeworkRequest: false, referencedEntryIds: [] };
  }

  let knowledgeContext = params.knowledgeContext;
  let referencedEntryIds: string[] = [];
  if (!knowledgeContext) {
    try {
      const retrieved = await retrieveRelevantEntries(subject, gradeLevel, message);
      knowledgeContext = formatKnowledgeContext(retrieved);
      referencedEntryIds = retrieved.map((r) => r.entry.id);
    } catch {
      // RAG is best-effort; fall back to generation without knowledge context.
    }
  }

  const language = LOCALE_LANGUAGE_NAMES[getLocale()];
  const systemPrompt =
    buildTutorSystemPrompt({ subject, gradeLevel, difficulty: performance.currentDifficulty, knowledgeContext, language }) +
    '\nBegin every reply with exactly one tag as the first token: [HOMEWORK] when presenting a new question, ' +
    "[CORRECT] when the student's prior answer was correct, [INCORRECT] when it was wrong, or [INFO] for anything else " +
    '(hints, explanations, off-topic redirects).';

  const raw = await generateTutorResponse(systemPrompt, [...history, { role: 'student', content: message }]);

  const tag = raw.match(TAG_PATTERN)?.[1]?.toUpperCase();
  const reply = raw.replace(TAG_PATTERN, '').trim();

  const updated: PerformanceSnapshot = { ...performance };
  let isHomeworkRequest = false;

  if (tag === 'HOMEWORK') {
    isHomeworkRequest = true;
    updated.totalQuestions += 1;
  } else if (tag === 'CORRECT') {
    updated.consecutiveCorrect += 1;
    updated.consecutiveIncorrect = 0;
    if (updated.consecutiveCorrect >= 2) {
      updated.currentDifficulty = nextDifficulty(updated.currentDifficulty, true);
      updated.consecutiveCorrect = 0;
    }
  } else if (tag === 'INCORRECT') {
    updated.consecutiveIncorrect += 1;
    updated.consecutiveCorrect = 0;
    if (updated.consecutiveIncorrect >= 2) {
      updated.currentDifficulty = nextDifficulty(updated.currentDifficulty, false);
      updated.consecutiveIncorrect = 0;
    }
  }

  return { reply, performance: updated, isHomeworkRequest, referencedEntryIds };
}
