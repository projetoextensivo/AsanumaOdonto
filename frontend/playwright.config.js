import { defineConfig, devices } from '@playwright/test';

const frontendDir = import.meta.dirname;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    headless: process.env.PW_HEADED !== '1',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
    viewport: { width: 1440, height: 900 },
  },
  webServer: [
    {
      command: `node "${frontendDir}/tests/e2e/start-backend.mjs"`,
      cwd: frontendDir,
      url: 'http://127.0.0.1:8080/api/health',
      reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
      timeout: 180_000,
    },
    {
      command: 'npm run dev',
      cwd: frontendDir,
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
      timeout: 60_000,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
