import { defineStore } from 'pinia'
import { shallowRef, computed, triggerRef, ref, watch } from 'vue'
import { GameWorld } from '../domain/engine/world'
import { createWorldFromSave, resetSystemContext } from '../domain/game-facade'
import { appGameCommands, appGameQueries } from '@/application/game'
import { PLAYER_ENTITY } from '../domain/engine/components/index'
import type { RecoveryCard } from '../domain/balance/types'
import { LocalStorageSaveRepository } from '@/infrastructure/persistence/LocalStorageSaveRepository'
import { checkAgeUnlocks, resetAgeUnlocksState } from '@/composables/useAgeRestrictions/age-unlocks'
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
import type { ExecuteActionCommandResult } from '@/domain/game-facade/commands'

export const useGameStore = defineStore('game', () => {
  const saveRepository = new LocalStorageSaveRepository()
  // ===== State =====
  const world = shallowRef<GameWorld | null>(null)
  /**
   * Счётчик мутаций мира.
   * world — shallowRef, и его глубокие мутации (wallet.money, stats.energy…)
   * не отслеживаются реактивностью Vue автоматически.
   * Инкремент worldVersion заставляет зависимые computed пересчитываться.
   */
  const worldVersion = ref(0)
  /**
   * Токен версии мира — используется для создания реактивной зависимости
   * в computed. Явное чтение значения гарантирует, что Vue отследит зависимость.
   */
  const worldVersionToken = computed(() => worldVersion.value)
  const isInitialized = computed(() => world.value !== null)
  const playerName = ref('Алексей')

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
    // Зависимость от worldVersionToken гарантирует пересчёт после глубоких мутаций
    const version = worldVersionToken.value
    if (!world.value) return null
    const comp = world.value.getComponent<WalletComponent>(PLAYER_ENTITY, 'wallet')
    // Возвращаем новый объект с версией, чтобы Vue видел изменение
    return comp ? { ...comp, _version: version } as unknown as WalletComponent : null
  })

  const skills = computed<SkillsComponent | null>(() => {
    const _wv = worldVersionToken.value
    if (!world.value) return null
    return world.value.getComponent<SkillsComponent>(PLAYER_ENTITY, 'skills')
  })

  const career = computed<CareerComponent | null>(() => {
    const _wv = worldVersionToken.value
    if (!world.value) return null
    return world.value.getComponent<CareerComponent>(PLAYER_ENTITY, 'career')
  })

  const housing = computed<HousingComponent | null>(() => {
    const _wv = worldVersionToken.value
    if (!world.value) return null
    return world.value.getComponent<HousingComponent>(PLAYER_ENTITY, 'housing')
  })

  const education = computed<EducationComponent | null>(() => {
    const _wv = worldVersionToken.value
    if (!world.value) return null
    return world.value.getComponent<EducationComponent>(PLAYER_ENTITY, 'education')
  })

  /**
   * Канонический снимок текущей работы для UI.
   * UI-компоненты должны использовать этот computed вместо прямого чтения work/career/currentJob.
   */
  const currentJobSnapshot = computed(() => {
    const _wv = worldVersionToken.value
    const w = world.value
    if (!w) return null
    const work = w.getComponent<Record<string, unknown>>('player', 'work')
    const career = w.getComponent<Record<string, unknown>>('player', 'career')
    const legacyCurrentJob = (career?.currentJob as Record<string, unknown> | undefined) ?? null
    const source = work ?? legacyCurrentJob ?? career
    if (!source || !source.id) return null

    return {
      id: source.id as string,
      name: (source.name as string) || 'Безработный',
      employed: source.employed !== false,
      salaryPerHour: Math.max(0, Number(source.salaryPerHour) || 0),
      salaryPerDay: Math.max(0, Number(source.salaryPerDay) || 0),
      salaryPerWeek: Math.max(0, Number(source.salaryPerWeek) || 0),
      requiredHoursPerWeek: Math.max(0, Number(source.requiredHoursPerWeek) || 0),
      workedHoursCurrentWeek: Math.max(0, Number(source.workedHoursCurrentWeek) || 0),
      pendingSalaryWeek: Math.max(0, Number(source.pendingSalaryWeek) || 0),
      schedule: (source.schedule as string) || '—',
      level: Math.max(0, Number(source.level) || 0),
      totalWorkedHours: Math.max(0, Number(source.totalWorkedHours) || 0),
      daysAtWork: Math.max(0, Number(source.daysAtWork) || 0),
    }
  })

  const money = computed(() => {
    const val = wallet.value?.money ?? 0
    console.log('[store.money] bump triggered, value =', val)
    return val
  })
  const gameDays = computed(() => {
    if (!time.value) return 0
    return time.value.gameDays ?? 0
  })
  const age = computed(() => {
    if (!time.value) return 18
    return (time.value as unknown as Record<string, unknown>).currentAge as number ?? 18
  })

  // Отслеживать смену возраста и показывать уведомления о разблокировке
  watch(age, (newAge) => {
    checkAgeUnlocks(newAge)
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

  /**
   * Уведомить реактивность о глубокой мутации мира.
   * Вызывать после любых изменений компонентов через ECS.
   */
  function bumpWorldVersion() {
    worldVersion.value++
    triggerRef(world)
  }

  function save() {
    if (!world.value) return
    const snapshot = world.value.toJSON() as Record<string, unknown>
    snapshot.playerName = playerName.value
    saveRepository.save(snapshot)
  }

  function load(): boolean {
    const data = saveRepository.load()
    if (!data || !world.value) return false
    const savedName = data.playerName

    // Сбрасываем кэш систем перед загрузкой, чтобы старые системы
    // (с подписками на eventBus) были заменены новыми.
    resetSystemContext(world.value)

    world.value.fromJSON(data as Parameters<GameWorld['fromJSON']>[0])

    // Заменяем eventBus, чтобы обработчики удалённых систем
    // больше не получали события (предотвращает дубликаты в журнале).
    world.value.eventBus = new EventTarget()

    if (typeof savedName === 'string' && savedName.trim()) {
      playerName.value = savedName
    }
    bumpWorldVersion()
    return true
  }

  function resetGame(): void {
    saveRepository.clear()
    world.value = null
    playerName.value = 'Алексей'
  }

  function getWorld(): GameWorld | null {
    return world.value
  }

  // ===== Recovery & Work =====

  function applyRecoveryAction(cardData: Record<string, unknown> | RecoveryCard): string {
    if (!world.value) return ''
    const result = appGameCommands.executeLifestyleAction(world.value, cardData as Record<string, unknown>)
    bumpWorldVersion()
    save()
    return result || ''
  }

  function applyWorkShift(hours: number): string {
    if (!world.value) return ''
    const result = appGameCommands.simulateWorkShift(world.value, hours)
    bumpWorldVersion()
    save()
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
    bumpWorldVersion()
    save()
    return result
  }

  function advanceEducation(): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.advanceEducation(world.value)
    bumpWorldVersion()
    save()
    return result
  }

  // ===== Finance =====

  function getFinanceOverview() {
    if (!world.value) return null
    return appGameQueries.getFinanceOverview(world.value)
  }

  function getFinanceActions() {
    if (!world.value) return []
    return appGameQueries.getFinanceActions(world.value)
  }

  function getFinanceSnapshot() {
    if (!world.value) return null
    return appGameQueries.getFinanceSnapshot(world.value, PLAYER_ENTITY)
  }

  function applyFinanceAction(actionId: string, _amount?: number): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.executeFinanceDecision(world.value, actionId)
    bumpWorldVersion()
    save()
    return result
  }

  function getInvestments() {
    if (!world.value) return []
    return appGameQueries.getInvestments(world.value)
  }

  function collectInvestment(investmentId: string): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.collectInvestment(world.value, investmentId)
    bumpWorldVersion()
    save()
    return result
  }

  // ===== Actions =====

  function canExecuteAction(actionId: string): { canExecute: boolean; reason?: string } {
    if (!world.value) return { canExecute: false, reason: 'Мир не инициализирован' }
    return appGameQueries.canExecuteAction(world.value, actionId)
  }

  function executeAction(actionId: string): ExecuteActionCommandResult {
    if (!world.value) return { message: 'Мир не инициализирован' }
    const result = appGameCommands.executeAction(world.value, actionId)
    bumpWorldVersion()
    save()
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
    bumpWorldVersion()
    save()
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
    bumpWorldVersion()
    save()
  }

  // ===== Monthly Settlement =====

  function applyMonthlySettlement(): string {
    if (!world.value) return 'Мир не инициализирован'
    const result = appGameCommands.applyMonthlySettlement(world.value)
    bumpWorldVersion()
    save()
    return result
  }

  return {
    world,
    isInitialized,
    playerName,
    currentJobSnapshot,
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
    getFinanceActions,
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

