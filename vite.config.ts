import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Kashi-gawa/',
  optimizeDeps: {
    include: ['kuromoji', 'kuromoji/src/loader/BrowserDictionaryLoader.js'],
  },
  resolve: {
    alias: {
      path: 'path-browserify',
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
