
import { useTimeStore } from './time-store'
import { useStatsStore } from './stats-store'
import { useWalletStore } from './wallet-store'
import { useSkillsStore } from './skills-store'
import { useCareerStore } from './career-store'
import { useEducationStore } from './education-store'
import { useHousingStore } from './housing-store'
import { usePlayerStore } from './player-store'
import { usePlayerStateStore } from './player-state-store'
import type { PlayerStateSnapshot } from './player-state-store/player-state-store.types'
import { useEventsStore } from './events-store'
import { useActionsStore } from './actions-store'
import type { Investment } from './finance-store'
import { useFinanceStore } from './finance-store'
import { useCalendarPlanStore } from '@/stores/calendar-plan-store'
import type { ActivityEntry } from './activity-store'
import { useActivityStore } from './activity-store'
import type { GameEvent } from './events-store/events-store.types'
import { getActionById, type BalanceAction } from '@/domain/balance/actions'
import type { CareerTrackJobItem, EducationProgram } from '@/domain/balance/types'
import { EDUCATION_PROGRAMS } from '@/domain/balance/constants/education-programs'
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON, GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'
import type { DayPlanInput, DayPlanResult, GameEventPayload } from '@/domain/game-world/commands/commands.types'
import type { DayEndHooks } from '@/domain/game-world/commands'
import { createLiveDayEndHooks } from '@/domain/game-world/commands'
import { fromStores, applyToStores } from '@/domain/game-world/bridge'
import type { StoresLoadTarget, StoresSnapshot } from '@/domain/game-world/bridge.types'
import type { GameMode, GameModeConfig, SyncStatus } from '@/domain/game-mode'
import {
  createExecutor,
  createQueryExecutor,
  appGameCommands,
  OfflineQueueManager,
  resolveEventDecision,
} from '@/application/game'
import type {
  AsyncGameExecutor,
  AsyncGameQueryExecutor,
  CommandOutcome,
  QueuedAction,
  SyncOutcome,
} from '@/application/game'
import type { ApiResponse, GameStateResponse, SyncResponse } from '@game-life/contracts'
import { getGameMode, getGameModeConfig } from '@/infrastructure/config/game-mode'
import { createMathRandomSource } from '@/infrastructure/random/math-random-source'
import type { ActionResult } from '@/stores/actions-store'
import type {
  CanApplyWorkShiftResult,
  CanExecuteActionResult,
  CanStartEducationResult,
  ChangeCareerResult,
  ExecuteActionResult,
  FinanceOverview,
  FinanceSnapshot,
  GameActionItem,
  QuitCareerResult,
  ServerConflictErrorCandidate,
  ServerSessionErrorCandidate,
} from './game.store.types'

export const useGameStore = defineStore('game', () => {
  const worldVersion: Ref<number> = ref<number>(0)
  const isInitialized: Ref<boolean> = ref<boolean>(true)

  const time = useTimeStore()

  const stats = useStatsStore()

  const wallet = useWalletStore()

  const skills = useSkillsStore()

  const career = useCareerStore()

  const education = useEducationStore()

  const housing = useHousingStore()

  const player = usePlayerStore()

  const playerState = usePlayerStateStore()

  const events = useEventsStore()

  const actions = useActionsStore()

  const finance = useFinanceStore()

  const calendarPlan = useCalendarPlanStore()

  const activity = useActivityStore()

  // --- Server-first migration: async executor layer (Stage 3) ---
  const gameMode: GameMode = getGameMode()

  const gameModeConfig: GameModeConfig = getGameModeConfig()

  const dayEndHooks: DayEndHooks = createLiveDayEndHooks(createMathRandomSource())

  const executor: AsyncGameExecutor = createExecutor(gameMode, {
    baseUrl: gameModeConfig.apiBaseUrl,
    dayEndHooks,
  })

  const queryExecutor: AsyncGameQueryExecutor = createQueryExecutor(gameMode, {
    baseUrl: gameModeConfig.apiBaseUrl,
  })

  const isOnline: Ref<boolean> = ref<boolean>(true)

  const pendingSyncCount: Ref<number> = ref<number>(0)

  const syncStatus: Ref<SyncStatus> = ref<SyncStatus>('idle')

  // Offline queue только для server/hybrid режимов
  const offlineQueue: OfflineQueueManager | null = gameModeConfig.offlineQueueEnabled
    ? new OfflineQueueManager()
    : null

  /**
   * Построить GameWorld из текущих Pinia stores (для SPA async executor).
   * @description [Store] - мост stores -> world.
   * @return { GameWorld }
   */
  function buildWorld(): GameWorld {
    const snapshot: StoresSnapshot = save() as unknown as StoresSnapshot
    return fromStores(snapshot)
  }

  /**
   * Записать изменения из world обратно в Pinia stores (для SPA async).
   * @description [Store] - мост world -> stores.
   * @param world источник
   * @return { void }
   */
  function syncFromWorld(world: GameWorld): void {
    const target: StoresLoadTarget = {
      player,
      time,
      stats,
      wallet,
      skills,
      career,
      education,
      housing,
      events,
      finance,
      activity,
      actions,
    }
    applyToStores(world, target)
    worldVersion.value++
  }

  function syncEventsFromWorld(world: GameWorld): void {
    const snapshot: GameWorldSnapshot = world.toSnapshot()

    events.load({
      eventState: snapshot.events.state,
      eventHistory: snapshot.events.history,
      eventQueue: snapshot.events.pending,
      seenEventIds: snapshot.events.state.seenEventIds,
    })
    worldVersion.value++
  }

  /**
   * Sync world → stores без events (UI queue/currentEvent — concern events-store).
   * @description [Store] - после resolveEventDecision, чтобы не затереть очередь UI.
   * @return { void }
   */
  function syncFromWorldExceptEvents(world: GameWorld): void {
    const target: StoresLoadTarget = {
      player,
      time,
      stats,
      wallet,
      skills,
      career,
      education,
      housing,
      finance,
      activity,
      actions,
    }
    applyToStores(world, target)
    worldVersion.value++
  }

  /**
   * Payload текущего UI-события для domain resolve.
   * @description [Store] - currentEvent живёт в events-store, не в GameWorld.pending.
   * @return { GameEventPayload | null }
   */
  function getCurrentEventPayload(eventId: string): GameEventPayload | null {
    const current: GameEvent | null = events.currentEvent

    if (!current || current.id !== eventId) return null

    return {
      id: current.id,
      instanceId: current.instanceId,
      title: current.title,
      choices: current.choices,
      data: current.data,
    }
  }

  async function refreshServerState(): Promise<void> {

    if (gameMode === 'spa') return
    const state: GameWorldJSON = await queryExecutor.getState(null)
    syncFromWorld(GameWorld.fromJSON(state))
  }

  async function initializeServerSession(
    initialState?: GameWorldJSON,
    options: { replace?: boolean } = {},
  ): Promise<void> {

    if (gameMode === 'spa') return

    if (initialState && options.replace) {
      const state: GameWorldJSON = await queryExecutor.initState(null, { saveData: initialState, replace: true })
      syncFromWorld(GameWorld.fromJSON(state))
      return
    }

    try {
      await refreshServerState()
    } catch (error) {
      if (!isMissingServerSession(error)) throw error
      const state: GameWorldJSON = await queryExecutor.initState(
        null,
        initialState ? { saveData: initialState } : undefined,
      )
      syncFromWorld(GameWorld.fromJSON(state))
    }
  }

  function isMissingServerSession(error: unknown): boolean {
    const candidate: ServerSessionErrorCandidate = error as ServerSessionErrorCandidate
    const message: string = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    return candidate.code === 'session_not_found'
      || candidate.statusCode === 404
      || candidate.data?.code === 'session_not_found'
      || message.includes('session not found')
  }

  async function withServerSessionRecovery<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (gameMode === 'spa' || !isMissingServerSession(error)) throw error
      const resetStateVersion = (executor as AsyncGameExecutor & { resetStateVersion?: () => void }).resetStateVersion
      resetStateVersion?.()
      await initializeServerSession(buildWorld().toJSON())
      return operation()
    }
  }

  const worldTick: ComputedRef<number> = computed(() => worldVersion.value)

  watch(() => time.gameWeeks, (newWeek: number, oldWeek: number | undefined) => {
    if (newWeek !== oldWeek && oldWeek !== undefined) {
      career.resetWeek()
    }
  })

  function initWorld(): void { worldVersion.value++ }

  function save(): Record<string, unknown> {
    const prologueStore = usePrologueStore()

    return {
      player: player.save(),
      time: time.save(),
      stats: stats.save(),
      wallet: wallet.save(),
      skills: skills.save ? skills.save() : {},
      career: career.save ? career.save() : {},
      education: education.save ? education.save() : {},
      housing: housing.save ? housing.save() : {},
      events: events.save ? events.save() : {},
      finance: finance.save ? finance.save() : {},
      activity: activity.save ? activity.save() : {},
      actions: actions.save ? actions.save() : {},
      calendarPlan: calendarPlan.save(),
      playerState: playerState.save(),
      ...prologueStore.save(),
    }
  }

  function load(data?: Record<string, unknown>): boolean {
    if (data?.player) player.load(data.player as Record<string, unknown>)

    if (data?.time) time.load(data.time as Record<string, unknown>)

    if (data?.stats) stats.load(data.stats as Record<string, unknown>)

    if (data?.wallet) wallet.load(data.wallet as Record<string, unknown>)

    if (data?.skills) skills.load?.(data.skills as Record<string, unknown>)

    if (data?.career) career.load?.(data.career as Record<string, unknown>)

    if (data?.education) education.load?.(data.education as Record<string, unknown>)

    if (data?.housing) housing.load?.(data.housing as Record<string, unknown>)

    if (data?.events) events.load?.(data.events as Record<string, unknown>)

    if (data?.finance) finance.load?.(data.finance as Record<string, unknown>)

    if (data?.activity) activity.load?.(data.activity as Record<string, unknown>)

    if (data?.actions) actions.load?.(data.actions as Record<string, unknown>)

    if (data?.calendarPlan) {
      calendarPlan.load(data.calendarPlan as Record<string, unknown>)
    } else if (data?.dayPlanner) {
      const legacyDayPlanner: Record<string, unknown> = data.dayPlanner as Record<string, unknown>
      const legacyPlan: Record<string, unknown> | undefined = legacyDayPlanner.plan as Record<string, unknown> | undefined

      if (legacyPlan) calendarPlan.load({ days: [legacyPlan] })
    }

    if (data?.playerState) {
      playerState.load(data.playerState as PlayerStateSnapshot)
    }

    usePrologueStore().load(data)

    isInitialized.value = true
    return true
  }

  function resetGame(): void {
    time.reset(); stats.reset(); wallet.reset(); skills.reset(); career.reset(); education.reset(); housing.reset(); player.reset(); playerState.reset(); activity.reset(); actions.reset(); events.reset(); finance.reset(); calendarPlan.reset()
    usePrologueStore().reset()
    offlineQueue?.clear()
    worldVersion.value++
  }

  async function resetServerSession(): Promise<void> {
    if (gameMode === 'spa') return

    const response: ApiResponse<GameStateResponse<GameWorldJSON>> = await $fetch<ApiResponse<GameStateResponse<GameWorldJSON>>>(
      `${gameModeConfig.apiBaseUrl}/api/game/reset`,
      { method: 'POST', credentials: 'include' },
    )

    if (!response.success || !response.data) throw new Error(response.error?.message ?? 'Не удалось очистить игровую сессию')

    executor.resetStateVersion?.()
    syncFromWorld(GameWorld.fromJSON(response.data.state))
  }

  function canApplyWorkShift(hours: number): CanApplyWorkShiftResult {
    if (!career.isEmployed) return { canDo: false, reason: 'Нет работы' }

    if (stats.energy < hours * 3) return { canDo: false, reason: 'Недостаточно энергии' }

    if (time.weekHoursRemaining < hours) return { canDo: false, reason: 'Недостаточно часов в неделе' }

    return { canDo: true }
  }

  function applyWorkShift(hours: number): string {
    const check: CanApplyWorkShiftResult = canApplyWorkShift(hours)

    if (!check.canDo) return check.reason ?? 'Ошибка'

    const result: string = appGameCommands.simulateWorkShift(hours)
    worldVersion.value++
    return result
  }

  function quitCareer(): QuitCareerResult {
    career.endWork()
    worldVersion.value++
    return { success: true, message: 'Вы уволились' }
  }

  function changeCareer(jobId: string): ChangeCareerResult {
    const result: ChangeCareerResult = appGameCommands.changeCareer(jobId)

    if (result.success) worldVersion.value++

    return result
  }

  function getCareerTrack(): CareerTrackJobItem[] {
    if (!career.currentJob?.employed) return []

    return [{
      id: career.currentJob.id,
      name: career.currentJob.name,
      level: career.currentJob.level,
      gradeLevel: Math.max(1, career.currentJob.level),
      minAge: 0,
      schedule: career.currentJob.schedule,
      salaryPerHour: career.currentJob.salaryPerHour,
      description: '',
      current: true,
      unlocked: true,
      missingProfessionalism: 0,
      missingAge: 0,
      educationRequiredLabel: '',
      missingPossessionLabels: [],
      effectiveSalaryPerHour: career.currentJob.salaryPerHour,
    }]
  }

  function getCareerSnapshot(): Record<string, unknown> | null { return career.currentJob }

  function getFinanceSnapshot(): FinanceSnapshot { return { monthlyExpenses: finance.monthlyExpenses } }

  function getFinanceActions(): never[] { return [] }

  function getActivityLogEntries(count: number = 10): ActivityEntry[] { return activity.getEntries(count) }

  function getActionByIdFromBalance(actionId: string): BalanceAction | null {
    return getActionById(actionId)
  }

  function toGameAction(action: BalanceAction): GameActionItem {
    return {
      id: action.id,
      title: action.title,
      category: action.category as string,
      actionType: action.actionType,
      hourCost: action.hourCost,
      price: action.price,
      statChanges: action.statChanges as Record<string, number> | undefined,
      skillChanges: action.skillChanges,
      cooldown: action.cooldown,
      requirements: action.requirements as { minAge?: number; minSkills?: Record<string, number>; requiresCompletedProgramId?: string } | undefined,
      oneTime: action.oneTime,
      grantsItem: action.grantsItem,
    }
  }

  function canExecuteAction(actionId: string): CanExecuteActionResult {
    const action: BalanceAction | null = getActionByIdFromBalance(actionId)

    if (!action) return { canDo: false, canExecute: false, reason: 'Действие не найдено' }

    const result: CanApplyWorkShiftResult = actions.canExecute(toGameAction(action))
    return { canDo: result.canDo, canExecute: result.canDo, reason: result.reason }
  }

  function executeAction(actionId: string): ExecuteActionResult {
    const action: BalanceAction | null = getActionByIdFromBalance(actionId)

    if (!action) return { success: false, message: 'Действие не найдено' }

    const result: ActionResult = actions.executeAction(toGameAction(action))
    return { success: result.success, message: result.summary ?? (result.success ? 'Выполнено' : result.error ?? 'Ошибка') }
  }

  function getFinanceOverview(): FinanceOverview { return { balance: wallet.money, expenses: finance.totalExpense, income: wallet.totalEarned } }

  function getInvestments(): Investment[] { return finance.investments }

  function applyRecoveryAction(cardData: Record<string, unknown>): string { return finance.applyAction(cardData) ? 'Выполнено' : '' }

  function collectInvestment(investmentId: string): string { return finance.divest(investmentId) > 0 ? 'Получено' : 'Ошибка' }

  function canStartEducationProgramWithReason(programId: string): CanStartEducationResult {
    if (!education.canStartProgramById(programId)) {
      return { ok: false, reason: 'Программа недоступна' }
    }

    if (education.activeEducation) {
      return { ok: false, reason: 'Уже учитесь' }
    }

    const program: EducationProgram | undefined = EDUCATION_PROGRAMS.find(candidate => candidate.id === programId)
    const completions: number = education.completedPrograms.filter(completed => completed.id === programId).length
    const maxCompletions: number = 1 + (program?.maxRepeats ?? 0)

    if (program?.track === 'book' && completions >= maxCompletions) {
      return { ok: false, reason: `Достигнут лимит повторного чтения: ${maxCompletions} прохождения` }
    }

    return { ok: true }
  }

  function startEducationProgram(programId: string): string | undefined {
    if (!education.canStartProgramById(programId)) return undefined

    education.startProgramById(programId, programId, 100)
    return 'Программа начата'
  }

  function advanceEducation(): void {
    if (!education.activeEducation) return

    education.updateProgress(1)
    education.cognitiveLoad += 10

    if (education.activeEducation?.hoursRemaining === 0) {
      education.cancelProgram()
    }
  }

  // --- Server-first migration: async methods (Stage 3) ---
  // Эти методы используют executor (SPA или server) и поддерживают режимы.
  // Синхронные методы выше остаются для back-compat.

  /**
   * Async executeAction через executor (SPA строит world, server — через API).
   * @description [Store] - server-first команда.
   * @return { Promise<ExecuteActionResult> }
   */
  async function executeActionAsync(actionId: string): Promise<ExecuteActionResult> {
    const world: GameWorld | null = gameMode === 'spa' ? buildWorld() : null
    let result: ExecuteActionResult
    try {
      result = await withServerSessionRecovery(() => executor.executeAction(world, actionId))
    } catch (error) {
      const candidate: ServerConflictErrorCandidate = error as ServerConflictErrorCandidate

      if (candidate.code === 'state_version_conflict') {
        await refreshServerState()
        return { success: false, message: 'Состояние обновлено из-за конфликта версий. Повторите действие.' }
      }
      throw error
    }
    await refreshServerState()

    if (gameMode === 'spa' && world) syncFromWorld(world)
    return result
  }

  async function planDayAsync(plan: DayPlanInput): Promise<DayPlanResult> {
    const world: GameWorld | null = gameMode === 'spa' ? buildWorld() : null
    const result: DayPlanResult = await withServerSessionRecovery(() => executor.planDay(world, plan))
    await refreshServerState()

    if (gameMode === 'spa' && world) syncFromWorld(world)
    return result
  }

  /**
   * Async applyWorkShift через executor.
   * @description [Store] - server-first команда.
   * @return { Promise<string> }
   */
  async function applyWorkShiftAsync(hours: number): Promise<string> {
    const check: CanApplyWorkShiftResult = canApplyWorkShift(hours)

    if (!check.canDo) return check.reason ?? 'Ошибка'

    const world: GameWorld | null = gameMode === 'spa' ? buildWorld() : null
    const result: string = await withServerSessionRecovery(() => executor.simulateWorkShift(world, hours))
    await refreshServerState()

    if (gameMode === 'spa' && world) syncFromWorld(world)
    return result
  }

  /**
   * Async changeCareer через executor.
   * @description [Store] - server-first команда.
   * @return { Promise<ChangeCareerResult> }
   */
  async function changeCareerAsync(jobId: string): Promise<ChangeCareerResult> {
    const world: GameWorld | null = gameMode === 'spa' ? buildWorld() : null
    const result: ChangeCareerResult = await withServerSessionRecovery(() => executor.changeCareer(world, jobId))
    await refreshServerState()

    if (gameMode === 'spa' && world) syncFromWorld(world)
    return result
  }

  /**
   * Async quitCareer через executor.
   * @description [Store] - server-first команда.
   * @return { Promise<QuitCareerResult> }
   */
  async function quitCareerAsync(): Promise<QuitCareerResult> {
    const world: GameWorld | null = gameMode === 'spa' ? buildWorld() : null
    const result: QuitCareerResult = await withServerSessionRecovery(() => executor.quitCareer(world))
    await refreshServerState()

    if (gameMode === 'spa' && world) syncFromWorld(world)

    return result
  }

  async function startEducationProgramAsync(programId: string): Promise<string> {
    const world: GameWorld | null = gameMode === 'spa' ? buildWorld() : null
    const result: string = await withServerSessionRecovery(() => executor.startEducationProgram(world, programId))
    await refreshServerState()

    if (gameMode === 'spa' && world) syncFromWorld(world)
    return result
  }

  async function advanceEducationAsync(): Promise<string> {
    const world: GameWorld | null = gameMode === 'spa' ? buildWorld() : null
    const result: string = await withServerSessionRecovery(() => executor.advanceEducation(world))
    await refreshServerState()

    if (gameMode === 'spa' && world) syncFromWorld(world)
    return result
  }

  async function resolveEventDecisionAsync(eventId: string, choiceId: string): Promise<CommandOutcome> {
    if (gameMode === 'spa') {
      const world: GameWorld = buildWorld()
      const payload: GameEventPayload | null = getCurrentEventPayload(eventId)
      const result: CommandOutcome = resolveEventDecision(world, eventId, payload, choiceId)

      if (result.success) {
        syncEventsFromWorld(world)
        syncFromWorldExceptEvents(world)
      }

      return result
    }

    const result: CommandOutcome = await withServerSessionRecovery(() =>
      executor.resolveEventDecision(null, eventId, choiceId),
    )

    await refreshServerState()
    return result
  }

  /**
   * Async getFinanceOverview через query executor.
   * @description [Store] - server-first query.
   * @return { Promise<FinanceOverview> }
   */
  async function getFinanceOverviewAsync(): Promise<FinanceOverview> {
    const world: GameWorld | null = gameMode === 'spa' ? buildWorld() : null
    const dto: FinanceOverview = await queryExecutor.getFinanceOverview(world)
    return dto
  }

  /**
   * Async getInvestments через query executor.
   * @description [Store] - server-first query.
   * @return { Promise<Investment[]> }
   */
  async function getInvestmentsAsync(): Promise<Investment[]> {
    const world: GameWorld | null = gameMode === 'spa' ? buildWorld() : null
    return queryExecutor.getInvestments(world)
  }

  // --- Server-first migration: offline queue integration (Stage 5.6) ---

  /**
   * Sync client для отправки оффлайн-очереди на сервер через /api/game/sync.
   * @description [Store] - offline queue sync adapter.
   * @param actions действия для отправки
   * @return { Promise<ApiResponse<SyncResponse>> } ответ сервера
   */
  function createSyncClient(actions: QueuedAction[]): Promise<ApiResponse<SyncResponse>> {
    return $fetch<ApiResponse<SyncResponse>>(`${gameModeConfig.apiBaseUrl}/api/game/sync`, {
      method: 'POST',
      body: {
        actions: actions.map((action: QueuedAction) => ({
          type: action.type,
          payload: action.payload,
          timestamp: action.timestamp,
          commandId: action.id,
          ...(action.expectedStateVersion === undefined ? {} : { expectedStateVersion: action.expectedStateVersion }),
        })),
      },
    })
  }

  /**
   * Синхронизировать оффлайн-очередь с сервером (при восстановлении сети).
   * @description [Store] - offline queue flush.
   * @return { Promise<void> }
   */
  async function flushOfflineQueue(): Promise<void> {
    if (!offlineQueue || !offlineQueue.hasPending()) return

    syncStatus.value = 'syncing'

    try {
      const outcome: SyncOutcome = await offlineQueue.syncWithServer(createSyncClient)

      pendingSyncCount.value = offlineQueue.size()

      if (outcome.failed > 0 && outcome.applied === 0) {
        syncStatus.value = 'error'
      } else {
        syncStatus.value = 'idle'
      }
    } catch {
      syncStatus.value = 'error'
    }
  }

  /**
   * Установить online-статус и запустить синхронизацию при восстановлении.
   * @description [Store] - online status update.
   * @param online новый статус
   * @return { Promise<void> }
   */
  async function setOnlineStatus(online: boolean): Promise<void> {
    const wasOffline: boolean = !isOnline.value
    isOnline.value = online

    if (online && wasOffline) {
      await flushOfflineQueue()
    }
  }

  return {
    worldVersion, worldTick, isInitialized,
    playerName: computed(() => player.name),
    welcomeScreenShown: computed(() => player.welcomeScreenShown),
    money: computed(() => wallet.money),
    energy: computed(() => stats.energy),
    health: computed(() => stats.health),
    hunger: computed(() => stats.hunger),
    stress: computed(() => stats.stress),
    mood: computed(() => stats.mood),
    comfort: computed(() => housing.comfort),
    age: computed(() => time.currentAge),
    gameDays: computed(() => time.gameDays),
    gameWeeks: computed(() => time.gameWeeks),
    weekHoursRemaining: computed(() => time.weekHoursRemaining),
    currentJobSnapshot: computed(() => career.currentJob),
    time: computed(() => ({ totalHours: time.totalHours, gameDays: time.gameDays, gameWeeks: time.gameWeeks, currentAge: time.currentAge, sleepDebt: time.sleepDebt, weekHoursRemaining: time.weekHoursRemaining })),
    stats: computed(() => ({ energy: stats.energy, health: stats.health, hunger: stats.hunger, stress: stats.stress, mood: stats.mood, physical: stats.physical })),
    wallet: computed(() => ({ money: wallet.money, reserveFund: wallet.reserveFund, totalEarned: wallet.totalEarned, totalSpent: wallet.totalSpent })),
    skills: computed(() => skills.skills),
    career: computed(() => career.currentJob),
    education: computed(() => ({ educationLevel: education.educationLevel, school: education.school, institute: education.institute, cognitiveLoad: education.cognitiveLoad, studyHoursSinceLastSleep: education.studyHoursSinceLastSleep, activeCourses: education.activeEducation ? [education.activeEducation] : [], completedPrograms: education.completedPrograms })),
    housing: computed(() => ({ level: housing.level, comfort: housing.comfort, furniture: housing.furniture })),
    getCareerTrack, getCareerSnapshot, getFinanceSnapshot, getFinanceActions, getActivityLogEntries, getStats: () => ({ energy: stats.energy, health: stats.health, hunger: stats.hunger, stress: stats.stress, mood: stats.mood }),
     initWorld, save, load, resetGame, resetServerSession, getWorldState: () => buildWorld().toJSON(),
    canApplyWorkShift, applyWorkShift, quitCareer, changeCareer,
    canExecuteAction, executeAction, getFinanceOverview, getInvestments, applyRecoveryAction, collectInvestment,
    canStartEducationProgramWithReason, startEducationProgram, advanceEducation,
    // server-first migration (Stage 3 + 5.6)
    executor, queryExecutor,
    gameMode,
    isOnline, pendingSyncCount, syncStatus,
    executeActionAsync, planDayAsync, applyWorkShiftAsync, changeCareerAsync, quitCareerAsync,
    startEducationProgramAsync, advanceEducationAsync, resolveEventDecisionAsync,
    initializeServerSession,
    getFinanceOverviewAsync, getInvestmentsAsync,
    flushOfflineQueue, setOnlineStatus,
  }
})
