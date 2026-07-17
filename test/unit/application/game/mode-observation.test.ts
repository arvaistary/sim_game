import { describe, expect, it } from 'vitest'
import { integrityScenarios } from '../../../fixtures/integrity/game-scenarios'
import { canonicalizeObservation, observeScenario } from '../../../helpers/game-mode-harness'

describe('canonical mode observations', () => {
  it('produces equivalent observables for every deterministic scenario', async () => {
    for (const scenario of integrityScenarios) {
      const observations = await Promise.all((['spa', 'server', 'hybrid'] as const).map(mode => observeScenario(scenario, mode)))
      expect(canonicalizeObservation(observations[1])).toEqual(canonicalizeObservation(observations[0]))
      expect(canonicalizeObservation(observations[2])).toEqual(canonicalizeObservation(observations[0]))
    }
  })
})
