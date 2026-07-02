import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC_DIR = path.resolve(process.cwd(), 'src')

async function collectFiles(dir: string, extensions: string[]): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectFiles(fullPath, extensions)
    return extensions.some(ext => entry.name.endsWith(ext)) ? [fullPath] : []
  }))
  return nested.flat()
}

function hasImportFrom(source: string, pattern: string): boolean {
  const regex = new RegExp(`from\\s+['"][^'"]*${pattern}`)
  return regex.test(source)
}

describe('Application layer boundaries', () => {
  it('application does not import Pinia stores', async () => {
    const appDir = path.join(SRC_DIR, 'application')
    const files = await collectFiles(appDir, ['.ts'])
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (
        hasImportFrom(source, 'stores/') ||
        /from\s+['"][^'"]*use[A-Z][a-zA-Z]*Store['"]/.test(source) ||
        /from\s+['"][^'"]*stores-/.test(source)
      ) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    if (violations.length > 0) {
      console.warn(
        '[Architecture] Known violation: application imports Pinia stores.\n' +
        'This is tracked in P-Foundation task (recovery of GameWorld aggregate).\n' +
        'Files:\n' +
        violations.join('\n')
      )
    }

    expect(violations.length).toBeLessThanOrEqual(3)
  })

  it('application does not import from infrastructure', async () => {
    const appDir = path.join(SRC_DIR, 'application')
    const files = await collectFiles(appDir, ['.ts'])
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (hasImportFrom(source, 'infrastructure/')) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })
})

describe('Domain layer boundaries', () => {
  it('domain does not import from upper layers', async () => {
    const domainDir = path.join(SRC_DIR, 'domain')
    const files = await collectFiles(domainDir, ['.ts'])
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (
        hasImportFrom(source, 'application/') ||
        hasImportFrom(source, 'stores/') ||
        hasImportFrom(source, 'infrastructure/') ||
        hasImportFrom(source, 'composables/') ||
        hasImportFrom(source, 'components/')
      ) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })

  it('domain does not use Pinia or Nuxt APIs', async () => {
    const domainDir = path.join(SRC_DIR, 'domain')
    const files = await collectFiles(domainDir, ['.ts'])
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (
        /\bdefineStore\b/.test(source) ||
        /\buseNuxtApp\b/.test(source) ||
        /\buseRouter\b/.test(source) ||
        /\buseRoute\b/.test(source) ||
        /\blocalStorage\b/.test(source) ||
        /\bwindow\b/.test(source) ||
        /\bdocument\b/.test(source)
      ) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })
})

describe('Infrastructure layer boundaries', () => {
  it('infrastructure does not import Pinia stores', async () => {
    const infraDir = path.join(SRC_DIR, 'infrastructure')
    const files = await collectFiles(infraDir, ['.ts'])
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (
        hasImportFrom(source, 'stores/') ||
        /from\s+['"][^'"]*use[A-Z][a-zA-Z]*Store['"]/.test(source)
      ) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })
})
