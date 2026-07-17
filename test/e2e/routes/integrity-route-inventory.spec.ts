import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { test, expect } from '@playwright/test'

async function pageFiles(root: string): Promise<string[]> {
  const result: string[] = []
  async function walk(dir: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await walk(path)
      else if (/\.(vue|ts)$/.test(entry.name)) result.push(relative(root, path))
    }
  }
  await walk(root)
  return result
}

function routeFromFile(file: string): string {
  const route = file.replace(/\\/g, '/').replace(/index\.vue$/, '').replace(/\.vue$/, '')
  return route ? `/${route}`.replace(/\/$/, '') : '/'
}

test('filesystem route inventory matches browser cases', async () => {
  const files = await pageFiles(join(process.cwd(), 'src/pages'))
  const routes = files.map(routeFromFile)
  expect(routes).toEqual(expect.arrayContaining(['/','/game','/game/finance']))
  expect(new Set(routes).size).toBe(routes.length)
})
