import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

async function collectFiles(dir: string, extension: string): Promise<string[]> {
  const entries = await readdir(dir)
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry)
    const fileStat = await stat(fullPath)
    if (fileStat.isDirectory()) return collectFiles(fullPath, extension)
    return fullPath.endsWith(extension) ? [fullPath] : []
  }))
  return nested.flat()
}

describe('Layer boundaries', () => {
  it('pages do not import ecs domain directly', async () => {
    const pagesDir = path.resolve(process.cwd(), 'src/pages')
    const files = await collectFiles(pagesDir, '.vue')
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (/from\s+['"][^'"]*domain\/ecs\//.test(source)) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })

  it('composables do not mutate world directly', async () => {
    const composablesDir = path.resolve(process.cwd(), 'src/composables')
    const files = await collectFiles(composablesDir, '.ts')
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (/getWorld\(\)|\.getComponent\(|\.updateComponent\(/.test(source)) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })
})
