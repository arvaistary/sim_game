import { executeActionCommand } from '@/domain/game-world/commands'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { createSPAAsyncExecutor } from '@/application/game/spa-async-executor'
import type { IntegrityScenario } from '../fixtures/integrity/game-scenarios'

export type HarnessMode = 'spa' | 'server' | 'hybrid'

export interface ModeObservation {
  scenarioId: string
  mode: HarnessMode
  allowedActions: string[]
  finalState: ReturnType<GameWorld['toSnapshot']>
  visibleResult: string
  transportMetadata: Record<string, unknown>
}

export function canonicalizeObservation(observation: ModeObservation): Omit<ModeObservation, 'transportMetadata' | 'mode'> {
  const finalState = structuredClone(observation.finalState)
  finalState.activity.entries = finalState.activity.entries.map(entry => ({ ...entry, id: '<activity-id>', timestamp: 0 }))
  return { scenarioId: observation.scenarioId, allowedActions: [...observation.allowedActions].sort(), finalState, visibleResult: observation.visibleResult }
}

export async function observeScenario(scenario: IntegrityScenario, mode: HarnessMode): Promise<ModeObservation> {
  const world = scenario.createWorld()
  const before = world.toSnapshot()
  let visibleResult = 'observed'
  if (scenario.id === 'time-advance') {
    world.time.totalHours += 1
    visibleResult = 'time advanced'
  } else if (scenario.id === 'save-load') {
    visibleResult = GameWorld.fromJSON(world.toJSON()).toJSON().version
  } else if (scenario.actionId) {
    const result = mode === 'spa'
      ? await createSPAAsyncExecutor().executeAction(world, scenario.actionId)
      : executeActionCommand(world, scenario.actionId)
    visibleResult = result.message
  }
  return { scenarioId: scenario.id, mode, allowedActions: scenario.actionId ? [scenario.actionId] : [], finalState: world.toSnapshot(), visibleResult, transportMetadata: { mode, beforeHours: before.time.totalHours } }
}
