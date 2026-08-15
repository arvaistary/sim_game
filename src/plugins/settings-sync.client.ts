/**
 * Синхронизация settings store с documentElement:
 *  - data-theme    → дублирует color-mode для SCSS selectors (html[data-theme="..."])
 *  - data-density  → включает compact overrides в global.scss
 *  - data-palette  → выбирает accent-палитру (tokens/palettes)
 *
 * Theme управляется через color-mode module (Topbar пишет в colorMode.preference),
 * но settings store нужен как source-of-truth для SettingsDrawer + onboarding flag + palette.
 * Здесь же зеркалим атрибуты на <html>.
 */
import { useSettingsStore, type ThemePreference } from '@/stores/settings-store'

export default defineNuxtPlugin(() => {
  const settings = useSettingsStore()
  const colorMode = useColorMode()

  // Density → data-density на documentElement
  watch(() => settings.density, (value) => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-density', value)
  }, { immediate: true })

  // Theme → единый source-of-truth для color-mode, класса и data-attr.
  watch(() => settings.theme, (value) => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', value)

    if (colorMode.preference !== value) colorMode.preference = value
  }, { immediate: true })

  watch(() => colorMode.preference, (value) => {
    if (value !== 'light' && value !== 'dark') return
    const theme: ThemePreference = value

    if (settings.theme !== theme) settings.setTheme(theme)
  })

  // Palette → data-palette на documentElement
  watch(() => settings.palette, (value) => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-palette', value)
  }, { immediate: true })
})
