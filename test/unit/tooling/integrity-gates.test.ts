import { describe, expect, it } from 'vitest'
import { runGate } from '../../../scripts/integrity-audit/gates'

describe('integrity gate capture', () => {
  it('captures passing output', async () => {
    const result = await runGate('G-001', 'vitest', 'node -e "console.log(\'pass\')"')
    expect(result.result).toBe('pass')
    expect(result.evidence).toContain('pass')
  })

  it('captures failures and redacts secrets', async () => {
    const result = await runGate('G-002', 'eslint', 'node -e "console.error(\'token=hidden\'); process.exit(2)"')
    expect(result.result).toBe('fail')
    expect(result.exitCode).toBe(2)
    expect(result.evidence).toContain('token=[REDACTED]')
  })

  it('marks timed out commands blocked', async () => {
    const result = await runGate('G-003', 'build', 'node -e "setTimeout(() => {}, 1000)"', { timeoutMs: 20 })
    expect(result.result).toBe('blocked')
    expect(result.exitCode).toBe(124)
  })
})
