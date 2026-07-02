
import { useTimeStore } from './time-store'
import { useStatsStore } from './stats-store'
import { useWalletStore } from './wallet-store'
import { useSkillsStore } from './skills-store'
import { useCareerStore } from './career-store'
import { useEducationStore } from './education-store'
import { useHousingStore } from './housing-store'
import { usePlayerStore } from './player-store'
import { useEventsStore } from './events-store'
import { useActionsStore } from './actions-store'
import type { Investment } from './finance-store'
import { useFinanceStore } from './finance-store'
import type { ActivityEntry } from './activity-store'
import { useActivityStore } from './activity-store'
import type { GameEvent } from './events-store/events-store.types'
import { getActionById, type BalanceAction } from '@/domain/balance/actions'
import type { CareerTrackJobItem } from '@/domain/balance/types'
import { appGameCommands } from '@/application/game/commands'
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

  const events = useEventsStore()

  const actions = useActionsStore()

  const finance = useFinanceStore()

  const activity = useActivityStore()

  const worldTick: ComputedRef<number> = computed(() => worldVersion.value)

  watch(() => time.gameWeeks, (newWeek: number, oldWeek: number | undefined) => {
    if (newWeek !== oldWeek && oldWeek !== undefined) {
      career.resetWeek()
    }
  })

  function initWorld(): void { worldVersion.value++ }

  function save(): Record<string, unknown> {
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

    isInitialized.value = true;
    return true
  }

  function resetGame(): void {
    time.reset(); stats.reset(); wallet.reset(); skills.reset(); career.reset(); education.reset(); housing.reset(); player.reset(); activity.reset()
    worldVersion.value++
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
    return career.currentJob ? [{ id: career.currentJob.id, name: career.currentJob.name, level: career.currentJob.level, schedule: career.currentJob.schedule, salaryPerHour: career.currentJob.salaryPerHour, description: '', current: true, unlocked: true, missingProfessionalism: 0, educationRequiredLabel: '', effectiveSalaryPerHour: career.currentJob.salaryPerHour }] : []
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
      requirements: action.requirements as { minAge?: number; minSkills?: Record<string, number> } | undefined,
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

  function getNextEvent(): GameEvent | null { return events.currentEvent }

  function applyEventChoice(_eventId: string, choiceId: string): string {
    const success: boolean = events.applyChoice(choiceId)
    return success ? 'Событие применено' : 'Ошибка'
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
    education: computed(() => ({ educationLevel: education.educationLevel, school: education.school, institute: education.institute, cognitiveLoad: education.cognitiveLoad, activeCourses: education.activeEducation ? [education.activeEducation] : [], completedPrograms: education.completedPrograms })),
    housing: computed(() => ({ level: housing.level, comfort: housing.comfort, furniture: housing.furniture })),
    getCareerTrack, getCareerSnapshot, getFinanceSnapshot, getFinanceActions, getActivityLogEntries, getStats: () => ({ energy: stats.energy, health: stats.health, hunger: stats.hunger, stress: stats.stress, mood: stats.mood }),
    initWorld, save, load, resetGame,
    canApplyWorkShift, applyWorkShift, quitCareer, changeCareer,
    canExecuteAction, executeAction, getNextEvent, applyEventChoice, getFinanceOverview, getInvestments, applyRecoveryAction, collectInvestment,
    canStartEducationProgramWithReason, startEducationProgram, advanceEducation
  }
})
