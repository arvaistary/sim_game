import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root: string = resolve(import.meta.dirname, '../../../..')

describe('accent glass design system contract', () => {
  it('exposes theme-aware material tokens and fallback mixins', () => {
    const globalStyles: string = readFileSync(resolve(root, 'src/assets/scss/global.scss'), 'utf8')
    const mixins: string = readFileSync(resolve(root, 'src/assets/scss/mixins.scss'), 'utf8')
    const shellStyles: string = readFileSync(resolve(root, 'src/components/layout/DashboardLayout/DashboardLayout.scss'), 'utf8')
    const modalStyles: string = readFileSync(resolve(root, 'src/components/ui/Modal/style.scss'), 'utf8')

    expect(globalStyles).toContain('--color-ambient-primary')
    expect(globalStyles).toContain('--color-glass-chrome: rgb(255 255 255 / 20%)')
    expect(globalStyles).toContain('--color-glass-chrome: rgb(15 23 42 / 30%)')
    expect(globalStyles).toContain('prefers-reduced-transparency')
    expect(mixins).toContain('@mixin glass-surface')
    expect(mixins).toContain('@mixin glass-surface($level: panel, $blur: true)')
    expect(mixins).toContain('@if $blur')
    expect(mixins).toContain('@mixin glass-fallback')
    expect(mixins).toContain('@supports not (backdrop-filter: blur(1px))')
    expect(shellStyles).toContain('@include ambient-canvas')
    expect(modalStyles).toContain('backdrop-filter: blur(var(--blur-glass-overlay))')
  })

  it('keeps RoundedPanel variants in the named type contract', () => {
    const types: string = readFileSync(resolve(root, 'src/components/ui/RoundedPanel/RoundedPanel.types.ts'), 'utf8')

    expect(types).toContain("'panel' | 'chrome' | 'inset' | 'solid'")
  })

  it('keeps data-theme and color-mode classes synchronized', () => {
    const syncPlugin: string = readFileSync(resolve(root, 'src/plugins/settings-sync.client.ts'), 'utf8')

    expect(syncPlugin).toContain('if (colorMode.preference !== value) colorMode.preference = value')
    expect(syncPlugin).toContain("if (value !== 'light' && value !== 'dark') return")
  })

  it('keeps the design fixture out of production builds', () => {
    const fixture: string = readFileSync(resolve(root, 'src/pages/dev/design-system.vue'), 'utf8')

    expect(fixture).toContain("if (!import.meta.dev)")
    expect(fixture).toContain(':aria-pressed="settings.theme === option.value"')
    expect(fixture).toContain(':aria-pressed="settings.palette === option.value"')
  })
})
