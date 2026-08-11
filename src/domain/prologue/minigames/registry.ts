import type { MinigameDescriptor, MinigameId } from './minigame.types'

const REGISTRY: Record<MinigameId, MinigameDescriptor> = {
  quiz: { id: 'quiz', implemented: true },
  'match-pairs': { id: 'match-pairs', implemented: true },
  'timed-tap': { id: 'timed-tap', implemented: false },
  'order-steps': { id: 'order-steps', implemented: false },
}

/**
 * @description [Prologue] - Реестр мини-игр.
 * @return { MinigameDescriptor } дескриптор
 */
export function getMinigame(id: MinigameId): MinigameDescriptor {
  return REGISTRY[id]
}
