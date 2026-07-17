import { describe, expect, it } from 'vitest'
import { integrityScenarios } from '../../fixtures/integrity/game-scenarios'
import { canonicalizeObservation, observeScenario } from '../../helpers/game-mode-harness'

describe('game mode parity', () => {
  it('covers SPA, Server, and Hybrid observations for catalog scenarios', async () => {
    for (const scenario of integrityScenarios) {
      const observations = await Promise.all((['spa', 'server', 'hybrid'] as const).map(mode => observeScenario(scenario, mode)))
      expect(new Set(observations.map(observation => JSON.stringify(canonicalizeObservation(observation)))).size, scenario.id).toBe(1)
    }
  })
})
