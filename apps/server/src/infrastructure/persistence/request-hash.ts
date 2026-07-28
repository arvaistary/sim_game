import { createHash } from 'node:crypto'
import type { GameCommandRequest } from '@game-life/application'

export function hashCommandRequest(command: GameCommandRequest): string {
  const canonical: string = JSON.stringify({
    commandId: command.commandId,
    expectedStateVersion: command.expectedStateVersion ?? null,
    type: command.type,
    payload: canonicalize(command.payload),
  })
  return createHash('sha256').update(canonical).digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}
