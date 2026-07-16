import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  testMatch: '**/*.spec.ts',
  outputDir: './test-results/integrity-audit',
  use: { baseURL: 'http://127.0.0.1:3000' },
  projects: [
    { name: '390x844', use: { viewport: { width: 390, height: 844 } } },
    { name: '768x1024', use: { viewport: { width: 768, height: 1024 } } },
    { name: '1440x900', use: { viewport: { width: 1440, height: 900 } } },
  ],
})
