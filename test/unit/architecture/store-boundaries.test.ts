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

describe('Architecture boundaries for stores', () => {
  it('does not import ECS systems directly from stores', async () => {
    const files = await collectTsFiles(STORES_DIR)
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      const hasDirectSystemsImport = /from\s+['"][^'"]*domain\/ecs\/systems\//.test(source)
      if (hasDirectSystemsImport) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })
})
