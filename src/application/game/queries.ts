import type { FinanceSnapshotDto, FinanceOverviewDto } from './index.types'
import { getActionById, type BalanceAction } from '@/domain/balance/actions'
import { useCareerStore } from '@/stores/career-store'
import { useEducationStore } from '@/stores/education-store'
import type { Investment, MonthlyExpense } from '@/stores/finance-store'
import { useFinanceStore } from '@/stores/finance-store'
import { useWalletStore } from '@/stores/wallet-store'
import type { ActivityEntry } from '@/stores/activity-store'
import { useActivityStore } from '@/stores/activity-store'
import type { GameEvent } from '@/stores/events-store'
import { useEventsStore } from '@/stores/events-store'
import { useTimeStore } from '@/stores/time-store'

export const appGameQueries = {
  getCareerTrack(): Array<Record<string, unknown>> {
    const careerStore = useCareerStore()

    return [careerStore.currentJob]
  },

  getActivityLogEntries(count: number = 8): Array<Record<string, unknown>> {
    const activityStore = useActivityStore()

    return activityStore.getEntries(count) as unknown as Array<Record<string, unknown>>
  },

  canStartEducationProgram(programId: string): boolean {
    const educationStore = useEducationStore()

    return educationStore.canStartProgramById(programId)
  },

  canStartEducationProgramWithReason(programId: string): CanStartEducationResult {
    const educationStore = useEducationStore()

    if (!educationStore.canStartProgramById(programId)) {
      return { ok: false, reason: 'Невозможно начать программу' }
    }
    return { ok: true }
  },

  getFinanceOverview(): FinanceOverviewDto {
    const walletStore = useWalletStore()

    const financeStore = useFinanceStore()

    return {
      balance: walletStore.money,
      expenses: financeStore.totalExpense,
      income: walletStore.totalEarned,
    }
  },

  getFinanceActions(): never[] {
    return []
  },

  getInvestments(): Investment[] {
    const financeStore = useFinanceStore()

    return financeStore.investments
  },

  canExecuteAction(actionId: string): { canExecute: boolean; reason?: string } {
    const action: BalanceAction | null = getActionById(actionId)

    if (!action) return { canExecute: false, reason: 'Действие не найдено' }

    const walletStore = useWalletStore()

    const timeStore = useTimeStore()

    if (walletStore.money < action.price) return { canExecute: false, reason: 'Недостаточно денег' }

    if (timeStore.weekHoursRemaining < action.hourCost) return { canExecute: false, reason: 'Недостаточно времени' }

    return { canExecute: true }
  },

  peekScheduledEvent(): Record<string, unknown> | null {
    const eventsStore = useEventsStore()

    return eventsStore.currentEvent as unknown as Record<string, unknown> | null
  },

  getActivityLog(filter?: string, limit?: number): ActivityEntry[] {
    const activityStore = useActivityStore()

    let entries: ActivityEntry[] = activityStore.entries

    if (filter && filter !== 'all') {
      entries = entries.filter((e: ActivityEntry) => e.type === filter)
    }

    if (limit) {
      entries = entries.slice(-limit)
    }
    return entries
  },

  getActivityTimelineWindow(count: number): ActivityEntry[] {
    const activityStore = useActivityStore()

    return activityStore.getEntries(count)
  },

  getEventQueue(): GameEvent[] {
    const eventsStore = useEventsStore()

    return eventsStore.eventQueue
  },

  getFinanceSnapshot(): FinanceSnapshotDto {
    const walletStore = useWalletStore()

    const financeStore = useFinanceStore()

    return {
      money: walletStore.money,
      reserveFund: walletStore.reserveFund,
      monthlyIncome: walletStore.totalEarned,
      monthlyExpenses: financeStore.monthlyExpenses
        .reduce(
          (acc: Record<string, number>, e: MonthlyExpense) => ({ ...acc, [e.category]: e.amount }),
          {} as Record<string, number>,
        ),
      emergencyFund: walletStore.reserveFund,
      deposits: [],
      portfolios: financeStore.investments,
    }
  },
}
