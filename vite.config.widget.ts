import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Builds `dist/conversia-core-widget.js`: the <conversia-app> custom element as a
// single, self-registering ES module, for embedding in host apps (e.g. ScalesViewer).
// Run after the regular `vite build` (see package.json) so it doesn't wipe that output.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(process.cwd(), 'src/webcomponent.ts'),
      formats: ['es'],
      fileName: () => 'conversia-core-widget.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
