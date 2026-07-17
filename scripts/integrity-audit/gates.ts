import { spawn } from 'node:child_process'
import type { GateRun } from './integrity-audit.types'
export interface GateOptions { cwd?: string; timeoutMs?: number }

export function runGate(id: string, gate: GateRun['gate'], command: string, options: GateOptions | string = {}): Promise<GateRun> {
  const startedAt = new Date().toISOString()
  const normalized: GateOptions = typeof options === 'string' ? { cwd: options } : options
  return new Promise(resolve => {
    const child = spawn(command, { cwd: normalized.cwd ?? process.cwd(), shell: true })
    let output = ''
    let timedOut = false
    const timer = normalized.timeoutMs ? setTimeout(() => { timedOut = true; child.kill() }, normalized.timeoutMs) : undefined
    child.stdout.on('data', data => { output += String(data) })
    child.stderr.on('data', data => { output += String(data) })
    child.on('close', code => {
      if (timer) clearTimeout(timer)
      const evidence = output
        .replace(/((?:token|password|secret|api[_-]?key)\s*[=:]\s*)[^\s&]+/gi, '$1[REDACTED]')
        .replace(/(authorization:\s*bearer\s+)[^\s]+/gi, '$1[REDACTED]')
      resolve({ id, gate, command, startedAt, completedAt: new Date().toISOString(), exitCode: timedOut ? 124 : (code ?? 1), result: timedOut ? 'blocked' : code === 0 ? 'pass' : 'fail', evidence: timedOut ? `${evidence}\nCommand timed out.` : evidence, relatedFindingIds: [] })
    })
  })
}
