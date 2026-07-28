import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { Pool } from 'pg'

const mode = process.argv[2] ?? 'migrate'
const command = mode === 'status' ? 'check' : 'migrate'
const runner = process.platform === 'win32' ? 'npx.cmd' : 'npx'

const result = spawnSync(runner, ['drizzle-kit', command], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
})

if (result.error) throw result.error
if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1)

if (mode === 'status') {
  const journalPath = new URL('../apps/server/src/infrastructure/persistence/migrations/meta/_journal.json', import.meta.url)
  const journal = JSON.parse(await readFile(journalPath, 'utf8'))
  const expected = Array.isArray(journal.entries) ? journal.entries.length : 0
  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgres://game:game@127.0.0.1:5432/game_life' })
  try {
    const query = await pool.query('SELECT COUNT(*)::int AS count FROM "drizzle"."__drizzle_migrations"')
    const applied = Number(query.rows[0]?.count ?? 0)
    console.log(`Migration version: applied=${applied}, expected=${expected}`)
    if (applied !== expected) process.exitCode = 1
  } finally {
    await pool.end()
  }
}
