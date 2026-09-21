export const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY as string;

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

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

export function isGeminiConfigured(): boolean {
  return Boolean(GEMINI_API_KEY);
}

export function isFirebaseConfigured(): boolean {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}
