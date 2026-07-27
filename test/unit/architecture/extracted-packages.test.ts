import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function collectTypeScriptFiles(directory: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(directory)) {
    const entryPath: string = join(directory, entry)

    if (statSync(entryPath).isDirectory()) {
      files.push(...collectTypeScriptFiles(entryPath))
    } else if (entry.endsWith('.ts')) {
      files.push(entryPath)
    }
  }
  return files
}

describe('extracted package boundaries', () => {
  it('keeps contracts, domain and application free from UI/runtime imports', () => {
    const packageRoot: string = resolve(process.cwd(), 'packages')
    const sourceFiles: string[] = collectTypeScriptFiles(packageRoot)
    const forbiddenImport: RegExp = /from\s+['"](?:vue|nuxt|pinia)|from\s+['"](?:@\/|~\/)|\b(?:useState|usePinia|defineNuxtConfig)\b/

    for (const sourceFile of sourceFiles) {
      const source: string = readFileSync(sourceFile, 'utf8')
      expect(source, sourceFile).not.toMatch(forbiddenImport)
    }
  })
})
