import { execFile } from 'node:child_process'
import { discoverInventory } from './inventory.ts'

const root = process.cwd()
function run(file: string, args: string[]): Promise<string> {
  return new Promise(resolve => {
    try {
      execFile(file, args, { cwd: root }, (error, stdout) => resolve(error ? 'unknown' : stdout.trim()))
    } catch {
      resolve('unknown')
    }
  })
}

const output = (await Promise.all([
  run('git', ['rev-parse', 'HEAD']),
  run('git', ['status', '--short']),
  run(process.execPath, ['--version']),
  process.platform === 'win32' ? run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', 'npm --version']) : run('npm', ['--version']),
])).map(value => value)

const [revision, dirty, nodeVersion, npmVersion] = output
const inventory = await discoverInventory(root)
console.log(JSON.stringify({
  nonMutating: true,
  baseline: {
    id: `AUD-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-01`,
    capturedAt: new Date().toISOString(),
    repositoryRevision: revision,
    dirtyPaths: dirty ? dirty.split(/\r?\n/).map(line => line.slice(2).trim()).filter(Boolean) : [],
    environment: { node: nodeVersion, npm: npmVersion, platform: process.platform, playwright: '1.50.1' },
  },
  inventory,
}, null, 2))
