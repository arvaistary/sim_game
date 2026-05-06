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

describe('Layer boundaries - application-first model', () => {
  it('application layer does not import stores', async () => {
    const appDir = path.resolve(process.cwd(), 'src/application/game')
    const files = await collectFiles(appDir, '.ts')
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (/from\s+['"][^'"]*stores\//.test(source)) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })

  it('application layer does not use Pinia', async () => {
    const appDir = path.resolve(process.cwd(), 'src/application/game')
    const files = await collectFiles(appDir, '.ts')
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (/useStore\(|defineStore\(|from\s+['"]pinia/.test(source)) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })

  it('application layer does not know about Nuxt/Browser APIs', async () => {
    const appDir = path.resolve(process.cwd(), 'src/application/game')
    const files = await collectFiles(appDir, '.ts')
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (/useNuxtApp\(|useRoute\(|useRouter\(|useState\(/.test(source) ||
        /localStorage|sessionStorage|window\.|document\./.test(source)) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })

  it('domain layer does not know about Nuxt/Pinia/persistence', async () => {
    const domainDir = path.resolve(process.cwd(), 'src/domain')
    const files = await collectFiles(domainDir, '.ts')
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      if (/useStore\(|defineStore\(|useState\(|from\s+['"]pinia/.test(source) ||
        /localStorage|sessionStorage|window\.|document\./.test(source) ||
        /useNuxtApp\(|useRoute\(|useRouter\(/.test(source)) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })

  it('pages do not import domain directly for business logic', async () => {
    const pagesDir = path.resolve(process.cwd(), 'src/pages')
    const files = await collectFiles(pagesDir, '.vue')
    const violations: string[] = []

    const allowedImports = [
      /from\s+['"]@domain\/balance\/actions\/types['"]/.source,
      /from\s+['"]@domain\/balance\/types['"]/.source,
    ]

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      const hasDomainImport = /from\s+['"]@domain\//.test(source)
      const hasTypeOnlyImport = /import\s+type\s+\{[^}]*\}\s+from\s+['"]@domain\//.test(source)
      const hasAllowedImport = allowedImports.some(pattern => new RegExp(pattern).test(source))

      if (hasDomainImport && !hasTypeOnlyImport && !hasAllowedImport) {
        violations.push(path.relative(process.cwd(), file))
      }
    }

    expect(violations).toEqual([])
  })

  it('composables do not import domain directly for business logic', async () => {
    const composablesDir = path.resolve(process.cwd(), 'src/composables')
    const files = await collectFiles(composablesDir, '.ts')
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      const fileName = path.relative(process.cwd(), file)

      if (fileName.includes('.types.ts') || fileName.includes('.constants.ts') || fileName.includes('-constants.ts')) {
        continue
      }

      const hasDomainImport = /from\s+['"]@domain\//.test(source)
      const hasTypeOnlyImport = /import\s+type\s+\{[^}]*\}\s+from\s+['"]@domain\//.test(source)

      if (hasDomainImport && !hasTypeOnlyImport) {
        violations.push(fileName)
      }
    }

    expect(violations).toEqual([])
  })

  it('application exports from index.ts only', async () => {
    const indexPath = path.resolve(process.cwd(), 'src/application/game/index.ts')
    const source = await readFile(indexPath, 'utf8')

    const validExports = [
      'commands',
      'queries',
      'ports',
      'index.types',
    ]

    const importMatches = source.match(/from\s+['"][^'"]+['"]/g) || []
    const violations: string[] = []

    for (const match of importMatches) {
      const module = match.replace(/from\s+['"]|['"]/g, '')
      const moduleName = module.split('/').pop() ?? ''
      const isValid = validExports.some((validExport) => moduleName === validExport || moduleName.endsWith(`-${validExport}`))
      if (moduleName && !isValid) {
        violations.push(`Invalid import in index.ts: '${module}' (module name: '${moduleName}')`)
      }
    }

    expect(violations).toEqual([])
  })

  it('stores do not use Pinia internals in other layers', async () => {
    const srcDir = path.resolve(process.cwd(), 'src')
    const files = await collectFiles(srcDir, '.ts')
    const violations: string[] = []

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      const fileName = path.relative(process.cwd(), file)

      if (fileName.includes('.constants.ts') || fileName.includes('.types.ts')) {
        continue
      }

      if (fileName.includes(path.join('src', 'stores') + path.sep)) {
        continue
      }

      if (/defineStore\(/.test(source)) {
        violations.push(fileName)
      }
    }

    expect(violations).toEqual([])
  })

  it('pages and components do not call game-store canExecuteAction/executeAction', async () => {
    const dirs = [
      path.resolve(process.cwd(), 'src/pages'),
      path.resolve(process.cwd(), 'src/components'),
    ]

    const violations: string[] = []

    for (const dir of dirs) {
      const vueFiles = await collectFiles(dir, '.vue')
      const tsFiles = await collectFiles(dir, '.ts')
      const allFiles = [...vueFiles, ...tsFiles]

      for (const file of allFiles) {
        const source = await readFile(file, 'utf8')
        const fileName = path.relative(process.cwd(), file)

        if (fileName.includes('.types.ts') || fileName.includes('.constants.ts')) {
          continue
        }

        if (/store\.canExecuteAction|store\.executeAction/.test(source)) {
          violations.push(fileName)
        }
      }
    }

    expect(violations).toEqual([])
  })
})