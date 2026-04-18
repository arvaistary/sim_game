/**
 * Проверяет, что в каждом файле каталога действий число полей id совпадает с числом ageGroup.
 * Не заменяет unit-тесты; быстрый регресс при правках balance/actions.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const actionsDir = path.join(root, 'src/domain/balance/actions')

const FILES = [
  'fun-actions.ts',
  'health-actions.ts',
  'selfdev-actions.ts',
  'hobby-actions.ts',
  'home-actions.ts',
  'career-actions.ts',
  'shop-actions.ts',
  'social-actions.ts',
  'finance-actions.ts',
  'education-actions.ts',
  'child-actions-registered.ts',
]

let failed = false
for (const name of FILES) {
  const filePath = path.join(actionsDir, name)
  const text = fs.readFileSync(filePath, 'utf8')
  const idCount = [...text.matchAll(/^\s+id:\s+['"]/gm)].length
  const ageCount = [...text.matchAll(/^\s+ageGroup:\s+AgeGroup\./gm)].length
  if (idCount !== ageCount) {
    console.error(`[audit] ${name}: id=${idCount} ageGroup=${ageCount}`)
    failed = true
  } else {
    console.log(`[audit] ${name}: OK (${idCount})`)
  }
}

if (failed) {
  console.error('[audit] failed')
  process.exit(1)
}
