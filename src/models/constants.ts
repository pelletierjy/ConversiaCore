export const PREDEFINED_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
];

export const GRADE_LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);

export const MIN_GRADE_LEVEL = 1;
export const MAX_GRADE_LEVEL = 20;

export function buildTutorSystemPrompt(params: {
  subject: string;
  gradeLevel: number;
  difficulty: string;
  knowledgeContext?: string;
  language: string;
}): string {
  const { subject, gradeLevel, difficulty, knowledgeContext, language } = params;
  return [
    `You are a patient, encouraging homework tutor for a grade ${gradeLevel} student studying ${subject}.`,
    `The student's current difficulty level is "${difficulty}".`,
    'Stay strictly focused on this subject, on homework help, and — when app-context reference material is provided below — on questions about the host application itself (its features, screens, or controls). If the student asks about anything else (games, movies, other off-topic chat), politely decline and redirect them back to their homework.',
    'When asked for homework, generate one grade-appropriate question at the current difficulty. When the student answers, evaluate correctness, explain why, and offer a hint or the solution if they are stuck.',
    'Keep responses concise and encouraging.',
    `Always respond in ${language}.`,
    knowledgeContext
      ? `Use the following reference material to ground your response when relevant. Some of it may describe the host application itself rather than curriculum content — answering direct questions about the app using that material is expected and is not off-topic:\n${knowledgeContext}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export const OFF_TOPIC_KEYWORDS = [
  'video game',
  'video games',
  'movie',
  'movies',
  'celebrity',
  'tiktok',
  'instagram',
  'youtube video',
  'football score',
  'song lyrics',
];
