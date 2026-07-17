import { readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import type { Inventory } from './integrity-audit.types'

async function files(root: string, dir: string): Promise<string[]> {
  const result: string[] = []
  async function walk(path: string) { for (const entry of await readdir(path, { withFileTypes: true })) { const p = join(path, entry.name); if (entry.isDirectory()) await walk(p); else result.push(relative(root, p)) } }
  await walk(join(root, dir)); return result
}
export async function discoverInventory(root: string): Promise<Inventory> {
  const pageFiles = await files(root, 'src/pages').catch(() => [])
  const apiFiles = await files(root, 'server/api/game').catch(() => [])
  return {
    routes: pageFiles
      .filter(f => /\.(vue|ts)$/.test(f))
      .map(f => f.replace(/^src[\\/]pages[\\/]?/, '').replace(/index\.vue$/, '').replace(/\.vue$/, '').replace(/\\/g, '/'))
      .map(route => route ? `/${route}`.replace(/\/$/, '') : '/'),
    endpoints: apiFiles.map(f => f.replace(/^server[\\/]api[\\/]?/, '').replace(/\.(get|post|put|delete|patch)\.ts$/, '').replace(/\\/g, '/')),
    layers: ['domain', 'application', 'infrastructure', 'server', 'store', 'composable', 'component', 'page'],
    scenarios: [],
    tests: (await files(root, 'test').catch(() => [])).filter(f => /test\.(ts|vue)$/.test(f)),
  }
}
