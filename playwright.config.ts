import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  use: { baseURL: 'http://localhost:5173', channel: 'msedge', hasTouch: true },
  webServer: { command: 'npm run dev', port: 5173, reuseExistingServer: true },
  projects: [
    { name: 'phone', use: { viewport: { width: 375, height: 667 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'tablet-landscape', use: { viewport: { width: 1024, height: 600 } } },
  ],
});
