import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';

// Builds `dist/need-homework-widget.js`: the <need-homework-app> custom element as a
// single, self-registering ES module, for embedding in host apps (e.g. ScalesViewer).
// Run after the regular `vite build` (see package.json) so it doesn't wipe that output.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
      'import.meta.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY ?? ''),
      'import.meta.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY ?? ''),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve(process.cwd(), 'src/webcomponent.ts'),
        formats: ['es'],
        fileName: () => 'need-homework-widget.js',
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  };
});
