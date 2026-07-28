import { describe, expect, it } from 'vitest'
import { hashCommandRequest } from '../../../apps/server/src/infrastructure/persistence/request-hash'

describe('hashCommandRequest', () => {
  it('is stable for differently ordered payload keys', () => {
    const first = hashCommandRequest({ commandId: 'cmd-1', type: 'action', payload: { b: 2, a: 1 } })
    const second = hashCommandRequest({ commandId: 'cmd-1', type: 'action', payload: { a: 1, b: 2 } })

    expect(first).toBe(second)
  })

  it('changes when command identity or payload changes', () => {
    const base = hashCommandRequest({ commandId: 'cmd-1', type: 'action', payload: { actionId: 'a' } })
    const differentId = hashCommandRequest({ commandId: 'cmd-2', type: 'action', payload: { actionId: 'a' } })
    const differentPayload = hashCommandRequest({ commandId: 'cmd-1', type: 'action', payload: { actionId: 'b' } })

    expect(base).not.toBe(differentId)
    expect(base).not.toBe(differentPayload)
  })
})
