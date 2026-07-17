import { test, expect } from '../fixtures/integrity-game'

const routes = ['/', '/game', '/game/actions', '/game/activity', '/game/education', '/game/events', '/game/finance', '/game/home', '/game/selfdev', '/game/shop', '/game/skills', '/game/work']

for (const route of routes) {
  test(`loads ${route} and supports direct URL`, async ({ page, navigate }) => {
    await navigate(route)
    await expect(page.locator('body')).toHaveCount(1)
    await page.goBack()
    await expect(page.locator('body')).toBeVisible()
  })
}
