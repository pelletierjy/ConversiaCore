import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ConversiaCore/',
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
});
