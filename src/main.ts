import "./styles.css";
import { renderApp } from "./ui/app";
import { initLocale } from "./i18n/locale";

// Populate runtime config for the standalone app from build-time env vars.
// The widget build sets these via attributes instead (see webcomponent.ts).
if (typeof window !== "undefined") {
  window.__NEED_HOMEWORK_CONFIG__ = {
    geminiApiKey: import.meta.env.GEMINI_API_KEY as string | undefined,
    groqApiKey: import.meta.env.GROQ_API_KEY as string | undefined,
    openrouterApiKey: import.meta.env.OPENROUTER_API_KEY as string | undefined,
    firebaseConfig: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    },
  };
}

const params = new URLSearchParams(window.location.search);
const theme = params.get("theme");
if (theme === "dark" || theme === "light") {
  document.documentElement.setAttribute("data-theme", theme);
}

initLocale();

const root = document.getElementById("app");
if (root) {
  renderApp(root);
}
