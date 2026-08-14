import * as sass from 'sass'

const compiled = sass.compile('src/assets/scss/global.scss', { style: 'expanded' }).css
const blocks = [...compiled.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
  selector,
  declarations: [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
}))

const palettes = ['cobalt', 'emerald', 'sunset', 'violet']
const themes = ['light', 'dark']

function applies(selector, palette, theme) {
  return selector.split(',').some((part) => {
    const normalized = part.replaceAll('"', '').replace(/\s+/g, '')
    const hasPalette = normalized.includes(`[data-palette=${palette}]`)
    const hasTheme = normalized.includes('[data-theme=dark]')
    return normalized === ':root'
      || (hasPalette && (theme === 'light' ? !hasTheme : hasTheme))
      || (hasTheme && theme === 'dark' && !hasPalette)
  })
}

function tokenMap(palette, theme) {
  const map = new Map()
  const relevant = blocks
    .filter((block) => applies(block.selector, palette, theme))
    .sort((left, right) => {
      const specificity = (selector) => (selector.includes('[data-palette=') ? 2 : 0) + (selector.includes('[data-theme=dark]') ? 1 : 0)
      return specificity(left.selector) - specificity(right.selector)
    })
  for (const block of relevant) {
    for (const [name, value] of block.declarations) map.set(name, value)
  }
  return map
}

function resolve(value, map, seen = new Set()) {
  if (!value) throw new Error('Missing token value')
  const match = value.match(/^var\((--[\w-]+)\)$/)
  if (!match) return value
  const name = match[1]
  if (seen.has(name)) throw new Error(`Circular token reference: ${name}`)
  const next = map.get(name)
  if (!next) throw new Error(`Missing token: ${name}`)
  return resolve(next, map, new Set([...seen, name]))
}

function luminance(value) {
  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i)
  if (!hex) throw new Error(`Contrast audit supports hex colors only, got ${value}`)
  const normalized = hex[1].length === 3
    ? hex[1].split('').map((channel) => channel + channel).join('')
    : hex[1]
  const channels = normalized.match(/../g).map((channel) => Number.parseInt(channel, 16) / 255)
  const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrast(foreground, background) {
  const foregroundLuminance = luminance(foreground)
  const backgroundLuminance = luminance(background)
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
}

const checks = [
  ['text-primary on card', '--color-text-primary', '--color-bg-card', 4.5],
  ['text-secondary on card', '--color-text-secondary', '--color-bg-card', 4.5],
  ['text-tertiary on card', '--color-text-tertiary', '--color-bg-card', 4.5],
  ['text-primary on elevated', '--color-text-primary', '--color-bg-elevated', 4.5],
  ['text-secondary on elevated', '--color-text-secondary', '--color-bg-elevated', 4.5],
  ['text-tertiary on elevated', '--color-text-tertiary', '--color-bg-elevated', 4.5],
  ['action-primary on card', '--color-action-primary', '--color-bg-card', 4.5],
  ['action-primary-hover on card', '--color-action-primary-hover', '--color-bg-card', 4.5],
  ['action-primary-active on card', '--color-action-primary-active', '--color-bg-card', 4.5],
  ['action-secondary on card', '--color-action-secondary', '--color-bg-card', 4.5],
  ['action-danger on card', '--color-action-danger', '--color-bg-card', 4.5],
  ['status-success on card', '--color-status-success', '--color-bg-card', 4.5],
  ['status-warning on card', '--color-status-warning', '--color-bg-card', 4.5],
  ['status-danger on card', '--color-status-danger', '--color-bg-card', 4.5],
  ['status-success-strong on card', '--color-status-success-strong', '--color-bg-card', 4.5],
  ['status-warning-strong on card', '--color-status-warning-strong', '--color-bg-card', 4.5],
  ['status-danger-strong on card', '--color-status-danger-strong', '--color-bg-card', 4.5],
  ['text-on-primary on primary', '--color-text-on-primary', '--color-action-primary', 4.5],
  ['text-on-primary on primary hover', '--color-text-on-primary', '--color-action-primary-hover', 4.5],
  ['text-on-primary on primary active', '--color-text-on-primary', '--color-action-primary-active', 4.5],
  ['text-on-accent on accent', '--color-text-on-accent', '--color-brand-accent', 4.5],
  ['text-on-status on success', '--color-text-on-status', '--color-status-success', 4.5],
  ['text-on-status on warning', '--color-text-on-status', '--color-status-warning', 4.5],
  ['text-on-status on danger', '--color-text-on-status', '--color-status-danger', 4.5],
  ['action-primary on pastel green', '--color-action-primary', '--color-pastel-green', 4.5],
  ['action-primary on pastel blue', '--color-action-primary', '--color-pastel-blue', 4.5],
  ['action-primary on pastel orange', '--color-action-primary', '--color-pastel-orange', 4.5],
  ['pastel-green-strong on pastel green', '--color-pastel-green-strong', '--color-pastel-green', 4.5],
  ['pastel-orange-strong on pastel orange', '--color-pastel-orange-strong', '--color-pastel-orange', 4.5],
  ['pastel-blue-strong on pastel blue', '--color-pastel-blue-strong', '--color-pastel-blue', 4.5],
]

const failures = []
for (const theme of themes) {
  for (const palette of palettes) {
    const map = tokenMap(palette, theme)
    for (const [label, foregroundName, backgroundName, minimum] of checks) {
      if (!map.has(foregroundName) || !map.has(backgroundName)) {
        throw new Error(`${theme}/${palette}: missing ${!map.has(foregroundName) ? foregroundName : backgroundName}`)
      }
      const foreground = resolve(map.get(foregroundName), map)
      const background = resolve(map.get(backgroundName), map)
      const ratio = contrast(foreground, background)
      if (ratio < minimum) failures.push(`${theme}/${palette}: ${label} ${ratio.toFixed(2)} < ${minimum}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Contrast audit passed: ${themes.length * palettes.length} theme/palette combinations, ${checks.length} token pairs.`)
}
