import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    // e2e/ is Playwright, not vitest — running it here fails on the
    // @playwright/test import, which is a devDependency of the e2e runner only.
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
  },
})
