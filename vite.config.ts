import { defineConfig } from 'vite';

export default defineConfig({
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
});
