import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// When deploying to GitHub Pages, the site is served from /<repo-name>/
// This base path ensures assets load correctly. For local dev it falls back to '/'.
const base = process.env.GITHUB_PAGES ? '/ai-tutor/' : '/';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
