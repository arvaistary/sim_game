/**
 * Синхронизация settings store с documentElement:
 *  - data-theme  → дублирует color-mode для SCSS selectors (html[data-theme="..."])
 *  - data-density → включает compact overrides в global.scss
 *
 * Theme управляется через color-mode module (Topbar пишет в colorMode.preference),
 * но settings store нужен как source-of-truth для SettingsDrawer + onboarding flag.
 * Здесь же зеркалим оба атрибута на <html>.
 */
import { useSettingsStore } from '@/stores/settings-store'

export default defineNuxtPlugin(() => {
  const settings = useSettingsStore()

  // Density → data-density на documentElement
  watch(() => settings.density, (value) => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-density', value)
  }, { immediate: true })

  // Theme → синхронизируем с color-mode для дублирующего data-attr
  watch(() => settings.theme, (value) => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', value)
  })
})
