import { DEFAULT_SAVE } from '@/domain/balance/constants/default-save'
import { PLAYER_ENTITY } from '@/domain/engine/components'
import { GameWorld } from '@/domain/engine/world'
import { ActivityLogSystem } from '@/domain/engine/systems/ActivityLogSystem'
import { gameCommands } from '@/domain/game-facade/commands'
import { gameQueries } from '@/domain/game-facade/queries'
import { resetSystemContext } from '@/domain/game-facade/system-context'
import type { AnyRecord } from '@/domain/game-facade/index.types'

export function createWorldFromSave(saveData?: AnyRecord): GameWorld {
  const data = saveData || (structuredClone(DEFAULT_SAVE) as unknown as AnyRecord)
  const world = new GameWorld()
  resetSystemContext(world)

  world.entities.set(PLAYER_ENTITY, { id: PLAYER_ENTITY, components: new Set() as never })

  if (data.stats) world.addComponent(PLAYER_ENTITY, 'stats', data.stats as AnyRecord)
  if (data.time) world.addComponent(PLAYER_ENTITY, 'time', data.time as AnyRecord)

  world.addComponent(PLAYER_ENTITY, 'wallet', {
    money: (data.money as number) ?? 5000,
    reserveFund: (data.finance as AnyRecord)?.reserveFund ?? 0,
    monthlyExpenses: 0,
    monthlyIncome: 0,
  })

  if (data.skills) {
    const skillsData = data.skills as Record<string, number>
    const skillsComponent: AnyRecord = {}
    for (const [key, level] of Object.entries(skillsData)) {
      skillsComponent[key] = { level, xp: 0 }
    }
    world.addComponent(PLAYER_ENTITY, 'skills', skillsComponent)
  }

  if (data.skillModifiers) world.addComponent(PLAYER_ENTITY, 'skillModifiers', data.skillModifiers as AnyRecord)
  if (data.currentJob) {
    const job = data.currentJob as AnyRecord
    world.addComponent(PLAYER_ENTITY, 'career', {
      currentJob: job,
      jobHistory: [],
      careerLevel: job.level ?? 1,
    })
  }
  if (data.housing) world.addComponent(PLAYER_ENTITY, 'housing', data.housing as AnyRecord)
  if (data.education) world.addComponent(PLAYER_ENTITY, 'education', data.education as AnyRecord)
  if (data.finance) world.addComponent(PLAYER_ENTITY, 'finance', data.finance as AnyRecord)
  world.addComponent(PLAYER_ENTITY, 'eventHistory', { history: (data.eventHistory as unknown[]) ?? [] })
  if (data.lifetimeStats) world.addComponent(PLAYER_ENTITY, 'lifetimeStats', data.lifetimeStats as AnyRecord)
  if (data.pendingEvents) world.addComponent(PLAYER_ENTITY, 'eventQueue', { pendingEvents: data.pendingEvents })
  if (data.investments) world.addComponent(PLAYER_ENTITY, 'investment', data.investments as AnyRecord)

  const logSystem = new ActivityLogSystem()
  logSystem.init(world)
  world.addSystem(logSystem)

  return world
}

export const gameDomainFacade = {
  ...gameCommands,
  ...gameQueries,
}
