import process from 'node:process'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runCommand } from '../../../scripts/e2e/run-integrity'

const repositoryRoot: string = resolve(process.cwd())
const npmCliPath: string = process.env.npm_execpath ?? resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
const integrityTimeoutMs: number = 180_000

describe('integrity E2E process lifecycle', () => {
  it('completes all 60 browser checks and exits successfully', async () => {
    const result = await runCommand(
      process.execPath,
      [npmCliPath, 'run', 'test:e2e:integrity'],
      { cwd: repositoryRoot, timeoutMs: integrityTimeoutMs, stdio: 'pipe' },
    )
    const output: string = `${result.stdout}\n${result.stderr}`

    expect(result.timedOut).toBe(false)
    expect(result.exitCode).toBe(0)
    expect(result.durationMs).toBeLessThanOrEqual(integrityTimeoutMs)
    expect(output).toMatch(/60 passed/i)
  }, 200_000)

  it('terminates deliberately hanging child processes within bounded time', async () => {
    const result = await runCommand(
      process.execPath,
      ['-e', 'setInterval(() => undefined, 1000)'],
      { cwd: repositoryRoot, timeoutMs: 500, stdio: 'ignore' },
    )

    expect(result.timedOut).toBe(true)
    expect(result.exitCode).toBe(124)
    expect(result.durationMs).toBeLessThan(5_000)
  }, 10_000)
})
