import { INITIAL_SAVE } from '@/domain/balance/constants/initial-save'
import { CHILDHOOD_SKILLS } from '@/domain/balance/constants/childhood-skills'
import {
  PLAYER_ENTITY,
  CHILDHOOD_SKILLS_COMPONENT,
  DELAYED_EFFECTS_COMPONENT,
  LIFE_MEMORY_COMPONENT,
  CHAIN_STATE_COMPONENT,
  TAGS_COMPONENT,
} from '@/domain/engine/components'
import { GameWorld } from '@/domain/engine/world'
import { ActivityLogSystem } from '@/domain/engine/systems/ActivityLogSystem'
import { TimeSystem } from '@/domain/engine/systems/TimeSystem'
import { gameCommands } from '@/domain/game-facade/commands'
import { gameQueries } from '@/domain/game-facade/queries'
import { resetSystemContext, getSystemContext } from '@/domain/game-facade/system-context'
export { resetSystemContext, getSystemContext } from '@/domain/game-facade/system-context'
import type { AnyRecord } from '@/domain/game-facade/index.types'

export function createWorldFromSave(saveData?: AnyRecord): GameWorld {
  /**
   * Canonical Data Contract (Phase 0 Gate):
   * 
   * - Loading old save never leaves world without `work` when `currentJob.id` exists.
   * - `career.currentJob` is read-only compatibility snapshot for old saves only.
   * - No component requires direct `career.currentJob` to function — all reads go through
   *   `work` component first, with `career` flat fields as fallback.
   * - `normalizeJobShape` in PersistenceSystem is the single migration helper for job data.
   */
  // Partial saves merge with INITIAL_SAVE (новая игра без демо-прогресса и без стартовой работы).
  const defaults = structuredClone(INITIAL_SAVE) as unknown as AnyRecord
  const data: AnyRecord = saveData ? { ...defaults, ...saveData } : defaults
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
  if (data.tags && typeof data.tags === 'object') {
    const rawTags = data.tags as AnyRecord
    const items: unknown[] = Array.isArray(rawTags.items) ? rawTags.items : []
    world.addComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items })
  }
  if (data.currentJob) {
    const job = data.currentJob as AnyRecord
    const requiredHoursPerWeek = Math.max(0, Number(job.requiredHoursPerWeek) || 0)
    const workedHoursCurrentWeek = Math.max(0, Number(job.workedHoursCurrentWeek) || 0)
    const pendingSalaryWeek = Math.max(0, Number(job.pendingSalaryWeek) || 0)
    const totalWorkedHours = Math.max(0, Number(job.totalWorkedHours) || 0)
    const daysAtWork = Math.max(0, Number(job.daysAtWork) || 0)

    world.addComponent(PLAYER_ENTITY, 'work', {
      id: job.id,
      name: job.name,
      schedule: job.schedule ?? '5/2',
      employed: job.employed ?? Boolean(job.id),
      level: job.level ?? 1,
      salaryPerHour: job.salaryPerHour ?? 0,
      salaryPerDay: job.salaryPerDay ?? 0,
      salaryPerWeek: job.salaryPerWeek ?? 0,
      requiredHoursPerWeek,
      workedHoursCurrentWeek,
      pendingSalaryWeek,
      totalWorkedHours,
      daysAtWork,
    })

    world.addComponent(PLAYER_ENTITY, 'career', {
      id: job.id,
      name: job.name,
      schedule: job.schedule ?? '5/2',
      employed: job.employed ?? Boolean(job.id),
      level: job.level ?? 1,
      salaryPerHour: job.salaryPerHour ?? 0,
      salaryPerDay: job.salaryPerDay ?? 0,
      salaryPerWeek: job.salaryPerWeek ?? 0,
      requiredHoursPerWeek,
      workedHoursCurrentWeek,
      pendingSalaryWeek,
      totalWorkedHours,
      daysAtWork,
      currentJob: job,
      jobHistory: [],
      careerLevel: job.level ?? 1,
    })
  } else {
    const unemployed: AnyRecord = {
      id: null,
      name: 'Безработный',
      schedule: '—',
      employed: false,
      level: 0,
      salaryPerHour: 0,
      salaryPerDay: 0,
      salaryPerWeek: 0,
      requiredHoursPerWeek: 0,
      workedHoursCurrentWeek: 0,
      pendingSalaryWeek: 0,
      totalWorkedHours: 0,
      daysAtWork: 0,
    }
    world.addComponent(PLAYER_ENTITY, 'work', unemployed)
    world.addComponent(PLAYER_ENTITY, 'career', {
      ...unemployed,
      careerLevel: 0,
      currentJob: null,
      jobHistory: [],
    })
  }
  if (data.housing) world.addComponent(PLAYER_ENTITY, 'housing', data.housing as AnyRecord)
  if (data.education) world.addComponent(PLAYER_ENTITY, 'education', data.education as AnyRecord)
  if (data.finance) world.addComponent(PLAYER_ENTITY, 'finance', data.finance as AnyRecord)
  world.addComponent(PLAYER_ENTITY, 'eventHistory', { events: (data.eventHistory as unknown[]) ?? [] })
  if (data.lifetimeStats) world.addComponent(PLAYER_ENTITY, 'lifetimeStats', data.lifetimeStats as AnyRecord)
  if (data.pendingEvents) world.addComponent(PLAYER_ENTITY, 'eventQueue', { pendingEvents: data.pendingEvents })
  if (data.investments) world.addComponent(PLAYER_ENTITY, 'investment', data.investments as AnyRecord)

  // === Childhood components ===
  // childhood_skills: caps и firstTouchAge для всех 27 детских навыков
  const childhoodCaps: Record<string, number> = {}
  const childhoodFirstTouchAge: Record<string, number | null> = {}
  for (const skill of CHILDHOOD_SKILLS) {
    childhoodCaps[skill.key] = 1.0
    childhoodFirstTouchAge[skill.key] = null
  }
  world.addComponent(PLAYER_ENTITY, CHILDHOOD_SKILLS_COMPONENT, {
    caps: childhoodCaps,
    firstTouchAge: childhoodFirstTouchAge,
  })

  // delayed_effects: пустой список отложенных последствий
  if (!world.getComponent(PLAYER_ENTITY, DELAYED_EFFECTS_COMPONENT)) {
    world.addComponent(PLAYER_ENTITY, DELAYED_EFFECTS_COMPONENT, { pending: [] })
  }

  // life_memory: пустой список воспоминаний
  if (!world.getComponent(PLAYER_ENTITY, LIFE_MEMORY_COMPONENT)) {
    world.addComponent(PLAYER_ENTITY, LIFE_MEMORY_COMPONENT, { memories: [], childhoodScore: 0 })
  }

  // chain_state: пустое состояние цепочек
  if (!world.getComponent(PLAYER_ENTITY, CHAIN_STATE_COMPONENT)) {
    world.addComponent(PLAYER_ENTITY, CHAIN_STATE_COMPONENT, { chains: {} })
  }

  world.addSystem(new TimeSystem())
  world.addSystem(new ActivityLogSystem())

  return world
}

export const gameDomainFacade = {
  ...gameCommands,
  ...gameQueries,
}
