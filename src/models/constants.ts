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

/** Sent to the AI when no host-provided system prompt is available (true standalone use, or an embedded host with no configured `appConfig/{context}` document yet). */
export const STANDALONE_EMBED_ONLY_PROMPT =
  'You are a demo assistant with no tutoring configuration in this context. ' +
  'Do not attempt to answer or tutor on any topic, no matter what the user asks. ' +
  'Explain that this tool (ConversiaCore) is designed to be embedded inside a host web app: ' +
  'the host must load the `<conversia-app>` web component and pass a `context` attribute naming itself, ' +
  "and an administrator must add a matching configuration document for that name under the \"Host Apps\" tab " +
  "of this tool's /admin page (a Firestore appConfig/{context} document with a systemPrompt and guardrails). " +
  'Always redirect the user to these instructions, whether or not it looks like the tool is already embedded — ' +
  'from your side, "not embedded" and "embedded but not yet configured" look identical.';

export function buildTutorSystemPrompt(params: {
  subject: string;
  gradeLevel: number;
  difficulty: string;
  knowledgeContext?: string;
  language: string;
  hasHostCommandTools?: boolean;
  hostSystemPrompt?: string;
}): string {
  const { difficulty, knowledgeContext, language, hasHostCommandTools, hostSystemPrompt } = params;

  if (!hostSystemPrompt) {
    return [STANDALONE_EMBED_ONLY_PROMPT, `Always respond in ${language}.`].join('\n');
  }

  return [
    hostSystemPrompt,
    `The student's current difficulty level is "${difficulty}".`,
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
