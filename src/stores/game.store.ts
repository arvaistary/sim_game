
import type {
  QuitCareerResult,
  CanExecuteActionResult,
  TimeSnapshot,
  StatsSnapshot,
  WalletSnapshot,
  EducationSnapshot,
  HousingSnapshot,
  CanApplyWorkShiftResult,
  CareerTrackEntry,
  ActionRequirements,
  FinanceOverview,
  StatsShortSnapshot,
  FinanceSnapshot,
} from './game.store.types'

import type {
  CanExecuteResult,
  ActionResult as ActionExecutionResult,
  GameAction,
} from './actions-store/index.types'
import type { JobSnapshot } from './career-store/index.types'
import type { SkillEntry } from './skills-store/index.types'
import type { GameEvent } from './events-store/index.types'
import type { Investment } from './finance-store/index.types'
import type { ActivityEntry } from './activity-store/index.types'

import { useActionsStore } from './actions-store'
import { useCareerStore } from './career-store'
import { useSkillsStore } from './skills-store'
import { useEducationStore } from './education-store'
import { useHousingStore } from './housing-store'
import { useEventsStore } from './events-store'
import { useFinanceStore } from './finance-store'
import { useActivityStore } from './activity-store'

import { useTimeStore } from './time-store'
import { useStatsStore } from './stats-store'
import { useWalletStore } from './wallet-store'
import { usePlayerStore } from './player-store'

import { getActionById, type BalanceAction } from '@domain/balance/actions'
import { appGameCommands } from '@application/game/commands'

export const useGameStore = defineStore('game', () => {
  const worldVersion = ref<number>(0)
  const isInitialized = ref<boolean>(true)

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

  const worldTick = computed<number>(() => worldVersion.value)

  // Еженедельный сброс рабочих часов при смене недели
  watch(() => time.gameWeeks, (newWeek, oldWeek) => {
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
    const check: CanExecuteResult = canApplyWorkShift(hours)

    if (!check.canDo) return check.reason ?? 'Ошибка'

    const salary: number = hours * (career.currentJob?.salaryPerHour ?? 0)
    career.addWorkHours(hours)
    career.addPendingSalary(salary)

    // Собираем зарплату сразу в кошелёк
    const actualSalary: number = career.collectSalary()
    wallet.earn(actualSalary)

    stats.applyStatChanges({ energy: -(hours * 3), hunger: +(hours * 2) })
    time.advanceHours(hours)
    worldVersion.value++
    activity.addWorkEntry('Работа', hours, actualSalary)

    return `Вы заработали ${actualSalary} ₽`
  }

  function quitCareer(): QuitCareerResult {
    career.endWork()
    worldVersion.value++

    return { success: true, message: 'Вы уволились' }
  }

  function changeCareer(jobId: string): QuitCareerResult {
    const result: QuitCareerResult = appGameCommands.changeCareer(jobId)

    if (result.success) worldVersion.value++

    return result
  }

  function getCareerTrack(): CareerTrackEntry[] {
    return career.currentJob ? [{ id: career.currentJob.id, name: career.currentJob.name, level: career.currentJob.level, schedule: career.currentJob.schedule, salaryPerHour: career.currentJob.salaryPerHour }] : []
  }

  function getCareerSnapshot(): JobSnapshot { return career.currentJob }
  function getFinanceSnapshot(): FinanceSnapshot { return { monthlyExpenses: finance.monthlyExpenses } }
  function getFinanceActions(): never[] { return [] }
  function getActivityLogEntries(count: number = 10): ActivityEntry[] { return activity.getEntries(count) }

  function getActionByIdFromBalance(actionId: string): BalanceAction | null {
    return getActionById(actionId)
  }

  function toGameAction(action: BalanceAction): GameAction {
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
      requirements: action.requirements as ActionRequirements | undefined,
    }
  }

  function canExecuteAction(actionId: string): CanExecuteActionResult {
    const action: BalanceAction | null = getActionByIdFromBalance(actionId)

    if (!action) return { canDo: false, canExecute: false, reason: 'Действие не найдено' }

    const result: CanExecuteResult = actions.canExecute(toGameAction(action))

    return { canDo: result.canDo, canExecute: result.canDo, reason: result.reason }
  }

  function executeAction(actionId: string): QuitCareerResult {
    const action: BalanceAction | null = getActionByIdFromBalance(actionId)

    if (!action) return { success: false, message: 'Действие не найдено' }

    const result: ActionExecutionResult = actions.executeAction(toGameAction(action))

    return { success: result.success, message: result.summary ?? (result.success ? 'Выполнено' : result.error ?? 'Ошибка') }
  }

  function getNextEvent(): GameEvent | null { return events.currentEvent }

  function applyEventChoice(eventId: string, choiceId: string): string {
    const success: boolean = events.applyChoice(choiceId)

    return success ? 'Событие применено' : 'Ошибка'
  }

  function getFinanceOverview(): FinanceOverview { return { balance: wallet.money, expenses: finance.totalExpense, income: wallet.totalEarned } }
  function getInvestments(): Investment[] { return finance.investments }
  function applyRecoveryAction(cardData: Record<string, unknown>): string { return finance.applyAction(cardData) ? 'Выполнено' : '' }
  function collectInvestment(investmentId: string): string { return finance.divest(investmentId) > 0 ? 'Получено' : 'Ошибка' }

  return {
    worldVersion, worldTick, isInitialized,
    playerName: computed<string>(() => player.name),
    welcomeScreenShown: computed<boolean>(() => player.welcomeScreenShown),
    money: computed<number>(() => wallet.money),
    energy: computed<number>(() => stats.energy),
    health: computed<number>(() => stats.health),
    hunger: computed<number>(() => stats.hunger),
    stress: computed<number>(() => stats.stress),
    mood: computed<number>(() => stats.mood),
    comfort: computed<number>(() => housing.comfort),
    age: computed<number>(() => time.currentAge),
    gameDays: computed<number>(() => time.gameDays),
    gameWeeks: computed<number>(() => time.gameWeeks),
    weekHoursRemaining: computed<number>(() => time.weekHoursRemaining),
    currentJobSnapshot: computed<JobSnapshot>(() => career.currentJob),
    time: computed<TimeSnapshot>(() => ({ totalHours: time.totalHours, gameDays: time.gameDays, gameWeeks: time.gameWeeks, currentAge: time.currentAge, sleepDebt: time.sleepDebt, weekHoursRemaining: time.weekHoursRemaining })),
    stats: computed<StatsSnapshot>(() => ({ energy: stats.energy, health: stats.health, hunger: stats.hunger, stress: stats.stress, mood: stats.mood, physical: stats.physical })),
    wallet: computed<WalletSnapshot>(() => ({ money: wallet.money, reserveFund: wallet.reserveFund, totalEarned: wallet.totalEarned, totalSpent: wallet.totalSpent })),
    skills: computed<Record<string, SkillEntry>>(() => skills.skills),
    career: computed<JobSnapshot>(() => career.currentJob),
    education: computed<EducationSnapshot>(() => ({ educationLevel: education.educationLevel, school: education.school, institute: education.institute, cognitiveLoad: education.cognitiveLoad, activeCourses: education.activeEducation ? [education.activeEducation] : [], completedPrograms: education.completedPrograms })),
    housing: computed<HousingSnapshot>(() => ({ level: housing.level, comfort: housing.comfort, furniture: housing.furniture })),
    getCareerTrack, getCareerSnapshot, getFinanceSnapshot, getFinanceActions, getActivityLogEntries, getStats: (): StatsShortSnapshot => ({ energy: stats.energy, health: stats.health, hunger: stats.hunger, stress: stats.stress, mood: stats.mood }),
    initWorld, save, load, resetGame,
    canApplyWorkShift, applyWorkShift, quitCareer, changeCareer,
    canExecuteAction, executeAction, getNextEvent, applyEventChoice, getFinanceOverview, getInvestments, applyRecoveryAction, collectInvestment
  }
})
