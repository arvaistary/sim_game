import { defineStore } from 'pinia'
import { shallowRef, computed, triggerRef, ref } from 'vue'
import { GameWorld } from '../domain/engine/world'
import { createWorldFromSave } from '../domain/game-facade'
import { appGameCommands, appGameQueries } from '@/application/game'
import { PLAYER_ENTITY } from '../domain/engine/components/index'
import type { RecoveryCard } from '../domain/balance/types'
import { LocalStorageSaveRepository } from '@/infrastructure/persistence/LocalStorageSaveRepository'
import type {
  StatsComponent,
  TimeComponent,
  WalletComponent,
  SkillsComponent,
  CareerComponent,
  HousingComponent,
  EducationComponent,
  ActivityLogEntry,
} from '../domain/engine/types'

export const useGameStore = defineStore('game', () => {
  const saveRepository = new LocalStorageSaveRepository()
  // ===== State =====
  const world = shallowRef<GameWorld | null>(null)
  const isInitialized = computed(() => world.value !== null)
  const playerName = ref('Алексей')
  const currentJobName = ref('Безработный')

  // ===== Computed from ECS =====
  const stats = computed<StatsComponent | null>(() => {
    if (!world.value) return null
    return world.value.getComponent<StatsComponent>(PLAYER_ENTITY, 'stats')
  })

  const time = computed<TimeComponent | null>(() => {
    if (!world.value) return null
    return world.value.getComponent<TimeComponent>(PLAYER_ENTITY, 'time')
  })

  const wallet = computed<WalletComponent | null>(() => {
    if (!world.value) return null
    return world.value.getComponent<WalletComponent>(PLAYER_ENTITY, 'wallet')
  })

  const skills = computed<SkillsComponent | null>(() => {
    if (!world.value) return null
    return world.value.getComponent<SkillsComponent>(PLAYER_ENTITY, 'skills')
  })

  const career = computed<CareerComponent | null>(() => {
    if (!world.value) return null
    return world.value.getComponent<CareerComponent>(PLAYER_ENTITY, 'career')
  })

  const housing = computed<HousingComponent | null>(() => {
    if (!world.value) return null
    return world.value.getComponent<HousingComponent>(PLAYER_ENTITY, 'housing')
  })

  const education = computed<EducationComponent | null>(() => {
    if (!world.value) return null
    return world.value.getComponent<EducationComponent>(PLAYER_ENTITY, 'education')
  })

  const money = computed(() => wallet.value?.money ?? 0)
  const gameDays = computed(() => {
    const w = world.value
    if (!w) return 1
    const t = w.getComponent<{ totalHours?: number }>(PLAYER_ENTITY, 'time')
    return t ? Math.floor((t.totalHours ?? 0) / 24) + 1 : 1
  })
  const age = computed(() => {
    const w = world.value
    if (!w) return 18
    const t = w.getComponent<{ totalHours?: number }>(PLAYER_ENTITY, 'time')
    return t ? 23 + Math.floor((t.totalHours ?? 0) / 24 / 365) : 23
  })
  const energy = computed(() => stats.value?.energy ?? 0)
  const hunger = computed(() => stats.value?.hunger ?? 0)
  const stress = computed(() => stats.value?.stress ?? 0)
  const mood = computed(() => stats.value?.mood ?? 0)
  const health = computed(() => stats.value?.health ?? 0)
  const physical = computed(() => stats.value?.physical ?? 0)
  const comfort = computed(() => housing.value?.comfort ?? 0)

  // ===== World Initialization =====

  function initWorld(saveData?: Record<string, unknown>) {
    const w = createWorldFromSave(saveData)
    if (saveData?.playerName) {
      playerName.value = saveData.playerName as string
    }
    world.value = w
  }

  // ===== Core Helpers =====

  function refresh() {
    if (world.value) {
      triggerRef(world)
    }
  }

  function save() {
    if (!world.value) return
    const data = world.value.toJSON()
    saveRepository.save(data as unknown as Record<string, unknown>)
  }

  function load(): boolean {
    const data = saveRepository.load()
    if (!data || !world.value) return false
    world.value.fromJSON(data)
    refresh()
    return true
  }

  function resetGame(): void {
    saveRepository.clear()
    world.value = null
    playerName.value = 'Алексей'
    currentJobName.value = 'Безработный'
  }

  function getWorld(): GameWorld | null {
    return world.value
  }

  // ===== Recovery & Work =====

  function applyRecoveryAction(cardData: Record<string, unknown> | RecoveryCard): string {
    if (!world.value) return ''
    const result = appGameCommands.executeLifestyleAction(world.value, cardData as Record<string, unknown>)
    triggerRef(world)
    return result || ''
  }

  function applyWorkShift(hours: number): string {
    if (!world.value) return ''
    const result = appGameCommands.simulateWorkShift(world.value, hours)
    triggerRef(world)
    return result || ''
  }

  function getCareerTrack(): Array<Record<string, unknown>> {
    if (!world.value) return []
    return appGameQueries.getCareerTrack(world.value)
  }

  function getActivityLogEntries(count = 8): Array<Record<string, unknown>> {
    if (!world.value) return []
    return appGameQueries.getActivityLogEntries(world.value, count)
  }

  // ===== Education =====

  function canStartEducationProgram(programId: string): boolean {
    if (!world.value) return false
    return appGameQueries.canStartEducationProgram(world.value, programId)
  }

  function startEducationProgram(programId: string): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.startEducationProgram(world.value, programId)
    triggerRef(world)
    return result
  }

  function advanceEducation(): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.advanceEducation(world.value)
    triggerRef(world)
    return result
  }

  // ===== Finance =====

  function getFinanceOverview() {
    if (!world.value) return null
    return appGameQueries.getFinanceOverview(world.value)
  }

  function getFinanceSnapshot() {
    if (!world.value) return null
    return appGameQueries.getFinanceSnapshot(world.value, PLAYER_ENTITY)
  }

  function applyFinanceAction(actionId: string, _amount?: number): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.executeFinanceDecision(world.value, actionId)
    triggerRef(world)
    return result
  }

  function getInvestments() {
    if (!world.value) return []
    return appGameQueries.getInvestments(world.value)
  }

  function collectInvestment(investmentId: string): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.collectInvestment(world.value, investmentId)
    triggerRef(world)
    return result
  }

  // ===== Actions =====

  function canExecuteAction(actionId: string): { canExecute: boolean; reason?: string } {
    if (!world.value) return { canExecute: false, reason: 'Мир не инициализирован' }
    return appGameQueries.canExecuteAction(world.value, actionId)
  }

  function executeAction(actionId: string): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.executeAction(world.value, actionId)
    triggerRef(world)
    return result
  }

  // ===== Events =====

  function getNextEvent(): Record<string, unknown> | null {
    if (!world.value) return null
    return appGameQueries.peekScheduledEvent(world.value)
  }

  function applyEventChoice(eventId: string, choiceId: string): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.resolveEventDecision(world.value, eventId, choiceId)
    triggerRef(world)
    return result
  }

  // ===== Activity Log =====

  function getActivityLog(filter?: string, limit?: number): ActivityLogEntry[] {
    if (!world.value) return []
    return appGameQueries.getActivityLog(world.value, filter, limit) as unknown as ActivityLogEntry[]
  }

  function getActivityLogWindow(count: number, beforeIndex?: number) {
    if (!world.value) return { entries: [], total: 0, hasMoreOlder: false, rangeStart: 0, rangeEnd: 0 }
    return appGameQueries.getActivityTimelineWindow(world.value, count, beforeIndex)
  }

  // ===== Time =====

  function advanceTime(hours: number): void {
    if (!world.value) return
    appGameCommands.advanceTime(world.value, hours)
    triggerRef(world)
  }

  // ===== Monthly Settlement =====

  function applyMonthlySettlement(): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.applyMonthlySettlement(world.value)
    triggerRef(world)
    return result
  }

  return {
    world,
    isInitialized,
    playerName,
    currentJobName,
    stats,
    time,
    wallet,
    skills,
    career,
    housing,
    education,
    money,
    gameDays,
    age,
    energy,
    hunger,
    stress,
    mood,
    health,
    physical,
    comfort,
    initWorld,
    refresh,
    save,
    load,
    resetGame,
    getWorld,
    applyRecoveryAction,
    applyWorkShift,
    getCareerTrack,
    getActivityLogEntries,
    canStartEducationProgram,
    startEducationProgram,
    advanceEducation,
    getFinanceOverview,
    getFinanceSnapshot,
    applyFinanceAction,
    getInvestments,
    collectInvestment,
    canExecuteAction,
    executeAction,
    getNextEvent,
    applyEventChoice,
    getActivityLog,
    getActivityLogWindow,
    advanceTime,
    applyMonthlySettlement,
  }
})

