import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
      'import.meta.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY ?? ''),
      'import.meta.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY ?? ''),
    },
    base: '/need-homework/',
    build: {
      outDir: 'dist',
    },
    server: {
      historyApiFallback: true,
    },
    test: {
      environment: 'jsdom',
      include: ['tests/unit/**/*.test.ts'],
    },
  };
});
