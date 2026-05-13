import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,   // keep sequential — tests share Supabase state
  retries: 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Step 1: log in and save session
    {
      name: 'setup',
      testMatch: '**/auth.setup.js',
    },
    // Step 2: run tests using the saved session
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  // Start vite dev server automatically before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
  },
})
