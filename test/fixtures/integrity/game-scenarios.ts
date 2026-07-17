import { GameWorld } from '@/domain/game-world/GameWorld'

export type IntegrityScenarioCategory = 'character' | 'core-loop' | 'time' | 'stats' | 'recovery-home' | 'work-career' | 'finance-investments' | 'education' | 'skills-self-development' | 'housing-shop' | 'events' | 'save-load' | 'offline-sync'

export interface IntegrityScenario {
  id: string
  category: IntegrityScenarioCategory
  description: string
  actionId?: string
  createWorld: () => GameWorld
}

const world = (): GameWorld => GameWorld.createEmpty({ player: { playerName: 'Audit', startAge: 18, currentAge: 18 } })

export const integrityScenarios: IntegrityScenario[] = [
  ['character-creation', 'character', 'create deterministic player', undefined],
  ['core-loop-action', 'core-loop', 'execute one catalog action', 'health_checkup'],
  ['time-advance', 'time', 'advance one hour', undefined],
  ['stats-projection', 'stats', 'read canonical stats', undefined],
  ['recovery-home', 'recovery-home', 'read recovery state', undefined],
  ['work-shift', 'work-career', 'execute work action', 'car_work_day'],
  ['finance-overview', 'finance-investments', 'read finance overview', undefined],
  ['investment-collection', 'finance-investments', 'read investments', undefined],
  ['education-progress', 'education', 'read education state', undefined],
  ['skills-training', 'skills-self-development', 'read skill state', undefined],
  ['housing-shop', 'housing-shop', 'read housing state', undefined],
  ['event-queue', 'events', 'read pending event queue', undefined],
  ['save-load', 'save-load', 'serialize and restore world', undefined],
  ['offline-sync', 'offline-sync', 'preserve ordered action payloads', undefined],
].map(([id, category, description, actionId]) => ({ id, category, description, actionId, createWorld: world }))
