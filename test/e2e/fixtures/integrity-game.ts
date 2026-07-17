import { test as base, expect, type Page } from '@playwright/test'

export interface IntegrityFixtures {
  consoleErrors: string[]
  navigate: (path: string) => Promise<void>
}

export const test = base.extend<IntegrityFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', error => errors.push(error.message))
    await use(errors)
  },
  navigate: async ({ page }, use) => {
    await use(async (path: string) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status() ?? 500).toBeLessThan(500)
      await expect(page.locator('body')).toHaveCount(1)
    })
  },
})

export { expect }
export type { Page }
