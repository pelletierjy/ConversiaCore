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
    'Stay strictly focused on this subject and homework help. If the student asks about anything unrelated (games, movies, other off-topic chat), politely decline and redirect them back to their homework.',
    'When asked for homework, generate one grade-appropriate question at the current difficulty. When the student answers, evaluate correctness, explain why, and offer a hint or the solution if they are stuck.',
    'Keep responses concise and encouraging.',
    `Always respond in ${language}.`,
    knowledgeContext
      ? `Use the following curriculum reference material to ground your response when relevant:\n${knowledgeContext}`
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
