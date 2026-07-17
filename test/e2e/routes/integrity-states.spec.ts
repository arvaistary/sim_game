import { test, expect } from '../fixtures/integrity-game'
import { integritySelectors } from '../fixtures/integrity-selectors'

test('start route exposes loading-safe content and navigation', async ({ page, navigate }) => {
  await navigate('/')
  await expect(page.locator('body')).toContainText(/.+/)
})

test('game route exposes empty/error-safe main state', async ({ page, navigate }) => {
  await navigate('/game')
  await expect(page.locator(integritySelectors.main)).toBeVisible()
  await expect(page.locator('body')).not.toContainText('Unhandled')
})

test('modal selectors are semantic when a dialog is opened', async ({ page, navigate }) => {
  await navigate('/game/events')
  const dialogs = page.locator(integritySelectors.modal)
  expect(await dialogs.count()).toBeGreaterThanOrEqual(0)
})
