import { defineConfig, devices } from '@playwright/test'

/**
 * Two browsers' worth of coverage against two different servers:
 *
 *  • `chromium` runs the app from the dev server, which is fast and is where
 *    every layout/behaviour spec lives.
 *
 *  • `pwa` runs against a real production build served by `vite preview`, at
 *    the same `/binyamin-english/` base GitHub Pages uses. The manifest, the
 *    service worker, the icon set and the prerendered HTML only exist in a
 *    build, so they can only honestly be inspected there.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /pwa\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['microphone'],
        launchOptions: {
          args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
        },
      },
    },
    {
      name: 'pwa',
      testMatch: /pwa\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:4173/binyamin-english/',
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'npm run build && npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173/binyamin-english/',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
})
