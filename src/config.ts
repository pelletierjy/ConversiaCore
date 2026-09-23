export const WORKER_BASE_URL = import.meta.env.VITE_WORKER_BASE_URL as string;

// gemini-1.5-flash / embedding-001 were retired by Google; verified against the live
// ListModels API on 2026-09-20 and replaced with the current supported models.
export const GEMINI_GENERATION_MODEL = 'gemini-flash-latest';
export const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';
// Default output size for gemini-embedding-001 (verified live 2026-09-20); the model also
// supports a smaller outputDimensionality via the REST API, but the current SDK version
// (@google/generative-ai) doesn't expose that parameter, so we use the default.
export const GEMINI_EMBEDDING_DIMENSION = 3072;
export const GEMINI_MAX_OUTPUT_TOKENS = 2048;
export const GEMINI_TEMPERATURE = 0.7;

// Verified against the live console.groq.com/docs/models on 2026-09-22. Groq deprecates
// model ids on a similar cadence to Google (see the GEMINI_* comment above) — re-check
// before relying on this long-term.
export const GROQ_GENERATION_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_MAX_OUTPUT_TOKENS = 2048;
export const GROQ_TEMPERATURE = 0.7;

// "openrouter/free" is OpenRouter's own auto-router across whichever free-tier models are
// currently available (verified live against openrouter.ai/api/v1/models on 2026-09-22,
// 24 free models today). Chosen over pinning one concrete free model id, since free-tier
// lineups churn often — the GEMINI_*/GROQ_* comments above are two examples of that
// already happening in this repo.
export const OPENROUTER_GENERATION_MODEL = 'openrouter/free';
export const OPENROUTER_MAX_OUTPUT_TOKENS = 2048;
export const OPENROUTER_TEMPERATURE = 0.7;

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

export function isGeminiConfigured(): boolean {
  return Boolean(WORKER_BASE_URL);
}

export function isGroqConfigured(): boolean {
  return Boolean(WORKER_BASE_URL);
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(WORKER_BASE_URL);
}

export function isFirebaseConfigured(): boolean {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}
