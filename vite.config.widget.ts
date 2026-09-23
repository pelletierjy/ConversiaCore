import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";

// Builds `dist/need-homework-widget.js`: the <need-homework-app> custom element as a
// single, self-registering ES module, for embedding in host apps (e.g. ScalesViewer).
// Run after the regular `vite build` (see package.json) so it doesn't wipe that output.
//
// IMPORTANT: No API keys are baked into this bundle. The widget reads them at runtime
// via the `gemini-api-key`, `groq-api-key`, `openrouter-api-key`, and `firebase-config`
// attributes on <need-homework-app>.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    // Explicitly blank out all Firebase env vars so Vite doesn't inline them from .env
    define: {
      "import.meta.env.VITE_FIREBASE_API_KEY": JSON.stringify(""),
      "import.meta.env.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify(""),
      "import.meta.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify(""),
      "import.meta.env.VITE_FIREBASE_STORAGE_BUCKET": JSON.stringify(""),
      "import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(""),
      "import.meta.env.VITE_FIREBASE_APP_ID": JSON.stringify(""),
    },
    build: {
      outDir: "dist",
      emptyOutDir: false,
      lib: {
        entry: resolve(process.cwd(), "src/webcomponent.ts"),
        formats: ["es"],
        fileName: () => "need-homework-widget.js",
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  };
});
