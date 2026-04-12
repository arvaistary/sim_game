/**
 * Подставляет в statChanges значения из merged-action-stats.json
 * (сгенерирован vitest: test/migration/print-merged-action-stats.test.ts).
 * Запуск: node scripts/apply-merged-action-stats.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const mergedPath = path.join(root, 'merged-action-stats.json')

const merged = JSON.parse(fs.readFileSync(mergedPath, 'utf8'))

const ORDER = ['hunger', 'energy', 'stress', 'mood', 'health', 'physical']

function formatStatChanges(stats) {
  const parts = []
  for (const k of ORDER) {
    if (stats[k] !== undefined && stats[k] !== 0) {
      parts.push(`${k}: ${stats[k]}`)
    }
  }
  for (const [k, v] of Object.entries(stats)) {
    if (!ORDER.includes(k) && v !== undefined && v !== 0) {
      parts.push(`${k}: ${v}`)
    }
  }
  return `{ ${parts.join(', ')} }`
}

function replaceStatChangesBlock(text, id, stats) {
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const idRe = new RegExp(`id:\\s*['"]${esc}['"]`)
  const m = text.match(idRe)
  if (!m || m.index === undefined) return null
  const from = m.index
  const rest = text.slice(from)
  const scIdx = rest.indexOf('statChanges:')
  if (scIdx === -1) return null
  const afterSc = rest.slice(scIdx)
  const braceStart = afterSc.indexOf('{')
  if (braceStart === -1) return null
  const absStart = from + scIdx + braceStart
  let depth = 0
  let i = absStart
  for (; i < text.length; i++) {
    const c = text[i]
    if (c === '{') depth++
    if (c === '}') {
      depth--
      if (depth === 0) {
        i++
        break
      }
    }
  }
  const newBlock = formatStatChanges(stats)
  return text.slice(0, absStart) + newBlock + text.slice(i)
}

const actionsDir = path.join(root, 'src/domain/balance/actions')

for (const fn of fs.readdirSync(actionsDir)) {
  if (!fn.endsWith('-actions.ts')) continue
  const fp = path.join(actionsDir, fn)
  let text = fs.readFileSync(fp, 'utf8')
  let changed = false
  for (const [id, stats] of Object.entries(merged)) {
    if (!text.includes(`'${id}'`) && !text.includes(`"${id}"`)) continue
    const next = replaceStatChangesBlock(text, id, stats)
    if (next !== null) {
      text = next
      changed = true
    }
  }
  if (changed) {
    fs.writeFileSync(fp, text, 'utf8')
    console.log('updated', fn)
  }
}
