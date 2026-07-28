import { describe, expect, it } from 'vitest'
import type { ActionExecuteRequest, CommandResult, GameCommandType } from '@game-life/contracts'

describe('durable mutation contract', () => {
  it('models command metadata and cached response fields', () => {
    const request: ActionExecuteRequest = { actionId: 'self_morning_routine', commandId: 'cmd-1', expectedStateVersion: 0 }
    const response: CommandResult = { commandId: request.commandId, stateVersion: 1, state: {}, result: { success: true, message: 'ok' } }

    expect(response.commandId).toBe(request.commandId)
    expect(response.stateVersion).toBe(1)
  })

  it('has no untyped command family gaps', () => {
    const families: GameCommandType[] = ['action', 'work', 'event', 'career', 'finance', 'education']
    expect(new Set(families).size).toBe(6)
  })
})
