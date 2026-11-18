import { defineConfig } from '@playwright/test';

// Needs local Supabase running and keys in .env.local (see README in the phase report).
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  // One worker: specs share one local Supabase and the dev server compiles routes on first hit,
  // so parallel files time out waiting on cold compiles.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    locale: 'vi-VN',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'mobile-chromium', use: { browserName: 'chromium' } }],
  // Production build on its own port: no on-demand route compiles (which made specs flaky on
  // dev), and it never collides with a dev server on :3000.
  webServer: {
    command: 'npm run build && npx next start -p 3100',
    url: 'http://localhost:3100/login',
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
