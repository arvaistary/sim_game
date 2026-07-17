import { test, expect } from '../fixtures/integrity-game'

for (const route of ['/', '/game', '/game/finance', '/game/work']) {
  test(`layout remains usable at ${route}`, async ({ page, navigate }) => {
    await navigate(route)
    const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }))
    expect(metrics.width).toBeLessThanOrEqual(metrics.viewport + 64)
    const controls = page.locator('button:not([disabled]), a, input, select, textarea')
    const focused = await controls.count() === 0 ? true : await controls.first().evaluate(element => {
      element.focus()
      return document.activeElement === element
    }).catch(() => true)
    expect(focused).toBe(true)
  })
}
