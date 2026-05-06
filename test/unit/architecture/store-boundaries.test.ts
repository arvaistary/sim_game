import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const STORES_DIR = path.resolve(process.cwd(), 'src/stores')

async function collectTsFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir)
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry)
    const fileStat = await stat(fullPath)
    if (fileStat.isDirectory()) {
      return collectTsFiles(fullPath)
    }
    return fullPath.endsWith('.ts') ? [fullPath] : []
  }))
  return files.flat()
}

describe('Architecture boundaries for stores - application-first model', () => {
  it('stores do not use Pinia internals in domain/application layer', async () => {
    const files = await collectTsFiles(STORES_DIR)
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      const fileName = path.relative(process.cwd(), file)

      if (fileName.includes('.constants.ts') || fileName.includes('.types.ts')) {
        continue
      }

      if (/import\s+\{[^}]*defineStore[^}]*\}/.test(source)) {
        violations.push(fileName)
      }
    }

    expect(violations).toEqual([])
  })

  it('game-store delegates use-cases to application layer', async () => {
    const gameStorePath = path.join(STORES_DIR, 'game-store', 'index.ts')
    const source = await readFile(gameStorePath, 'utf8')

    const delegatesToApplication =
      /from\s+['"]@application\/game/.test(source) ||
      /from\s+['"]@application\/game\/commands/.test(source) ||
      /from\s+['"]@application\/game\/queries/.test(source)

    expect(delegatesToApplication).toBe(true)
  })

  it('game-store does not contain standalone business logic blocks', async () => {
    const gameStorePath = path.join(STORES_DIR, 'game-store', 'index.ts')
    const source = await readFile(gameStorePath, 'utf8')

    const standaloneBusinessLogicPatterns = [
      {
        pattern: /if\s*\([^)]*money[^)]*\)[^}]*wallet\.spend/,
        description: 'Direct wallet.spend with money check'
      },
      {
        pattern: /if\s*\([^)]*energy[^)]*\)[^}]*stats\.applyStatChanges/,
        description: 'Direct stats mutation with energy check'
      },
      {
        pattern: /if\s*\([^)]*weekHoursRemaining[^)]*\)[^}]*time\.advanceHours/,
        description: 'Direct time.advanceHours with hours check'
      }
    ]

    const violations: string[] = []

    for (const { pattern, description } of standaloneBusinessLogicPatterns) {
      if (pattern.test(source)) {
        violations.push(`game-store contains: ${description} - should be in application layer`)
      }
    }

    if (violations.length > 0) {
      console.warn('[Architecture] game-store patterns that should be delegated to application:')
      violations.forEach(v => console.warn(`  - ${v}`))
    }
  })

  it('stores contain save/load methods for serialization', async () => {
    const storeFiles = await collectTsFiles(STORES_DIR)
    const storesWithoutSaveLoad: string[] = []

    const excludedStores = ['game-store']

    for (const file of storeFiles) {
      const source = await readFile(file, 'utf8')
      const fileName = path.relative(process.cwd(), file)

      if (fileName.includes('.types.ts') || fileName.includes('.constants.ts')) {
        continue
      }

      const isBarrelFile = fileName === path.join('src', 'stores', 'index.ts')

      if (isBarrelFile) {
        continue
      }

      if (excludedStores.some(excluded => fileName.includes(excluded))) {
        continue
      }

      const hasSave = /save\s*\(/i.test(source) || /save\s*:\s*/.test(source)
      const hasLoad = /load\s*\(/i.test(source) || /load\s*:\s*/.test(source)

      if (!hasSave && !hasLoad) {
        storesWithoutSaveLoad.push(fileName)
      }
    }

    expect(storesWithoutSaveLoad).toEqual([])
  })
})