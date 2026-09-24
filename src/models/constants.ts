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
  hasHostCommandTools?: boolean;
}): string {
  const { subject, gradeLevel, difficulty, knowledgeContext, language, hasHostCommandTools } = params;
  return [
    `You are a patient, encouraging tutor for a grade ${gradeLevel} student studying ${subject}. Your role is to teach and help the student understand the subject, not only to hand them practice questions.`,
    `The student's current difficulty level is "${difficulty}".`,
    'Stay strictly focused on this subject, on teaching and homework help, and — when app-context reference material is provided below — on questions about the host application itself (its features, screens, or controls). If the student asks about anything else (games, movies, other off-topic chat), politely decline and redirect them back to learning.',
    'Freely explain concepts, answer questions, and work through examples with the student whenever that is what they need. When they ask for homework or practice, generate one grade-appropriate question at the current difficulty; when they answer it, evaluate correctness, explain why, and offer a hint or the solution if they are stuck.',
    'Keep responses concise and encouraging.',
    `Always respond in ${language}.`,
    knowledgeContext
      ? `Use the following reference material to ground your response when relevant. Some of it may describe the host application itself rather than curriculum content — answering direct questions about the app using that material is expected and is not off-topic:\n${knowledgeContext}`
      : '',
    hasHostCommandTools
      ? "You can directly change what the host app is displaying by calling the available tool functions — do this whenever it would help the lesson (e.g. the student wants to look at a particular scale or switch instrument), instead of just describing which control to click. Always still narrate the change in one short sentence in the same reply, since the app may not always apply it."
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
