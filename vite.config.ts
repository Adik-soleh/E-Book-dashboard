import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: [
      'pdfjs-dist/build/pdf.worker.mjs',
      'pdfjs-dist/build/pdf.worker.js',
      'pdfjs-dist/legacy/build/pdf.worker.mjs',
    ],
  },
  worker: {
    format: 'es',
  },
});
