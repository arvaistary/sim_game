import {
  CAREER_COMPONENT,
  TIME_COMPONENT,
  WALLET_COMPONENT,
  FINANCE_COMPONENT,
  STATS_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import { SkillsSystem } from '../SkillsSystem'
import { TimeSystem } from '../TimeSystem'
import { StatsSystem } from '../StatsSystem'
import { summarizeStatChanges } from '../../utils/stat-change-summary'
import type { GameWorld } from '../../world'
import type { LegacyFinanceAction, StatChanges } from '@/domain/balance/types'
import type { FinanceOverview, FinanceActionResult, FinanceActionWithAvailability } from './index.types'
import { FINANCE_ACTIONS } from './index.constants'

/**
 * Система финансовых действий
 * Обрабатывает управление резервом, депозитами и бюджетом
 */
export class FinanceActionSystem {
  private world!: GameWorld
  private skillsSystem!: SkillsSystem
  private timeSystem!: TimeSystem
  private statsSystem!: StatsSystem
  private financeActions: LegacyFinanceAction[] = FINANCE_ACTIONS

  init(world: GameWorld): void {
    this.world = world
    this.skillsSystem = this._resolveSkillsSystem()
    this.skillsSystem.init(world)
    this.timeSystem = this._resolveTimeSystem(world)
    this.statsSystem = new StatsSystem()
    this.statsSystem.init(world)
  }

  private _resolveTimeSystem(world: GameWorld): TimeSystem {
    const existing = world.getSystem(TimeSystem)
    if (existing) return existing
    const created = new TimeSystem()
    world.addSystem(created)
    return created
  }

  private _resolveSkillsSystem(): SkillsSystem {
    const existing = this.world.getSystem(SkillsSystem)
    if (existing) return existing
    const created = new SkillsSystem()
    this.world.addSystem(created)
    return created
  }

  getFinanceOverview(): FinanceOverview | null {
    const playerId = PLAYER_ENTITY
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT) as Record<string, number> | null
    const finance = this.world.getComponent(playerId, FINANCE_COMPONENT) as Record<string, unknown> | null
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const rawInvestments = this.world.getComponent(playerId, 'investment')
    const investments: Array<Record<string, unknown>> = Array.isArray(rawInvestments) ? (rawInvestments as Array<Record<string, unknown>>) : []

    if (!wallet || !finance || !time) {
      return null
    }

    const monthlyExpenses = (finance.monthlyExpenses || {
      housing: 16000,
      food: 9000,
      transport: 4500,
      leisure: 6500,
      education: 2500,
    }) as Record<string, number>

    const expenseLines = [
      { id: 'housing', label: 'Жильё', amount: monthlyExpenses.housing ?? 0 },
      { id: 'food', label: 'Еда', amount: monthlyExpenses.food ?? 0 },
      { id: 'transport', label: 'Транспорт', amount: monthlyExpenses.transport ?? 0 },
      { id: 'leisure', label: 'Досуг', amount: monthlyExpenses.leisure ?? 0 },
      { id: 'education', label: 'Обучение', amount: monthlyExpenses.education ?? 0 },
    ]

    const monthlyExpensesTotal = expenseLines.reduce((sum, item) => sum + item.amount, 0)
    const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown> | null
    const salaryPerHour = this._resolveSalaryPerHour(career)
    const monthlyIncome = Math.round((salaryPerHour * 40) * 4)
    const reserveFund = (finance.reserveFund as number) ?? 0

    const activeInvestments = (investments as Array<Record<string, unknown>>).map((investment): Record<string, unknown> => {
      const state = this._getInvestmentState(investment, time.gameDays as number)
      const maturityDay = (investment.maturityDay as number) ?? (((investment.startDate as number) ?? 0) + ((investment.durationDays as number) ?? 28))
      return {
        ...investment,
        state,
        maturityDay,
        daysLeft: Math.max(0, maturityDay - (time.gameDays as number)),
        payoutAmount: ((investment.amount as number) ?? 0) + ((investment.expectedReturn as number) ?? 0),
      }
    })

    const investedTotal = activeInvestments
      .filter(item => item.state !== 'closed')
      .reduce((sum, item) => sum + ((item.amount as number) ?? 0), 0)

    const expectedReturnTotal = activeInvestments
      .filter(item => item.state !== 'closed')
      .reduce((sum, item) => sum + ((item.expectedReturn as number) ?? 0), 0)

    return {
      liquidMoney: wallet.money,
      reserveFund,
      investedTotal,
      expectedReturnTotal,
      monthlyIncome,
      monthlyExpensesTotal,
      monthlyBalance: monthlyIncome - monthlyExpensesTotal,
      expenseLines,
      investments: activeInvestments.filter(item => item.state !== 'closed'),
      lastMonthlySettlement: (finance.lastMonthlySettlement as Record<string, unknown>) ?? null,
    }
  }

  getFinanceActions(): FinanceActionWithAvailability[] {
    const overview = this.getFinanceOverview()
    if (!overview) {
      return []
    }
    const time = this._normalizePlayerTime()

    return this.financeActions.map((action) => {
      const cost = this._resolveHourCost(action)
      const weekBlocked =
        time && typeof (time as Record<string, unknown>).weekHoursRemaining === 'number' && cost > ((time as Record<string, unknown>).weekHoursRemaining as number)
      return {
        ...action,
        available: overview.liquidMoney >= action.amount && !weekBlocked,
        reason:
          overview.liquidMoney < action.amount
            ? `Нужно ${this._formatMoney(action.amount)} ₽ свободных денег.`
            : weekBlocked
              ? `Недостаточно времени в неделе. Нужно ${cost} ч., осталось ${(time as Record<string, unknown>).weekHoursRemaining} ч.`
              : '',
      }
    })
  }

  applyFinanceAction(actionId: string): FinanceActionResult {
    const action = this.financeActions.find(item => item.id === actionId)
    if (!action) {
      return { success: false, message: 'Финансовое действие не найдено.' }
    }

    const playerId = PLAYER_ENTITY
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT) as Record<string, number> | null
    const finance = this.world.getComponent(playerId, FINANCE_COMPONENT) as Record<string, unknown> | null

    if (!wallet || !finance) {
      return { success: false, message: 'Не удалось загрузить финансовые данные.' }
    }

    if (wallet.money < action.amount) {
      return { success: false, message: `Недостаточно свободных денег. Нужно ${this._formatMoney(action.amount)} ₽.` }
    }

    const timePrecheck = this._normalizePlayerTime()
    const hourCost = this._resolveHourCost(action)
    if (timePrecheck && typeof (timePrecheck as Record<string, unknown>).weekHoursRemaining === 'number' && hourCost > ((timePrecheck as Record<string, unknown>).weekHoursRemaining as number)) {
      return {
        success: false,
        message: `Недостаточно времени в неделе. Нужно ${hourCost} ч., осталось ${(timePrecheck as Record<string, unknown>).weekHoursRemaining} ч.`,
      }
    }
    // Специфичная обработка по action.id
    if (action.id === 'reserve_transfer') {
      wallet.money -= action.amount
      finance.reserveFund = Math.max(0, ((finance.reserveFund as number) ?? 0) + (action.reserveDelta ?? 0))
    } else if (action.id === 'open_deposit') {
      wallet.money -= action.amount
      this._openInvestment(action)
    } else if (action.id === 'budget_review') {
      const monthlyExpenses = finance.monthlyExpenses as Record<string, number>
      Object.entries(action.monthlyExpenseDelta ?? {}).forEach(([key, value]) => {
        const currentValue = monthlyExpenses[key] ?? 0
        monthlyExpenses[key] = Math.max(0, currentValue + value)
      })
    } else if (action.id === 'pay_off_small_debt') {
      wallet.money -= action.amount
    } else if (action.id === 'sell_unnecessary_items') {
      // Продажа вещей — небольшой случайный доход
      const saleIncome = Math.round(2000 + Math.random() * 3000)
      wallet.money += saleIncome
    } else if (action.amount > 0) {
      // Generic: списание денег для неизвестных действий с amount > 0
      wallet.money -= action.amount
    }

    if (action.statChanges) {
      this.statsSystem.applyStatChanges(action.statChanges)
    }

    if (action.skillChanges) {
      this.skillsSystem.applySkillChanges(action.skillChanges, `finance:${action.id}`)
    }

    const cost = this._resolveHourCost(action)
    this.timeSystem.advanceHours(cost, { actionType: 'finance_action' })

    if (this.world && this.world.eventBus) {
      const financeCategory = action.id === 'reserve_transfer' ? 'expense'
        : action.id === 'open_deposit' ? 'purchase'
        : 'expense'
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:finance', {
        detail: {
          category: financeCategory,
          title: `💰 ${action.title}`,
          description: action.description || action.title,
          icon: null,
          metadata: {
            amount: action.amount,
            item: action.id,
            balance: wallet.money,
          },
        },
      }))
    }

    const message = [
      `${action.title} выполнено.`,
      action.description,
      this._summarizeStatChanges(action.statChanges),
    ].filter(Boolean).join('\n')

    return { success: true, message }
  }

  _openInvestment(action: LegacyFinanceAction): void {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const rawInvestments = this.world.getComponent(playerId, 'investment')
    const investments = Array.isArray(rawInvestments) ? rawInvestments : [] as Array<Record<string, unknown>>

    const newInvestment: Record<string, unknown> = {
      id: `deposit_${investments.length + 1}`,
      type: 'deposit',
      label: action.title,
      amount: action.amount,
      startDate: time?.gameDays,
      durationDays: action.durationDays ?? 28,
      maturityDay: (time?.gameDays as number) + (action.durationDays ?? 28),
      expectedReturn: Math.round((action.expectedReturn ?? 0) * (this.skillsSystem.getModifiers().investmentReturnMultiplier ?? 1)),
      totalEarned: 0,
      status: 'active',
    }

    investments.push(newInvestment)
    this.world.updateComponent(playerId, 'investment', investments as unknown as Record<string, unknown>)
  }

  _getInvestmentState(investment: Record<string, unknown>, currentDay: number): string {
    if (investment.status === 'closed') {
      return 'closed'
    }

    const maturityDay = (investment.maturityDay as number) ?? (((investment.startDate as number) ?? 0) + ((investment.durationDays as number) ?? 28))
    if (currentDay >= maturityDay) {
      return 'matured'
    }

    return 'active'
  }

  _summarizeStatChanges(statChanges: StatChanges = {}): string {
    return summarizeStatChanges(statChanges)
  }

  _formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  _normalizePlayerTime(): Record<string, unknown> | null {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT)
    if (time) {
      this.timeSystem.normalizeTimeComponent(time as unknown as Parameters<typeof this.timeSystem.normalizeTimeComponent>[0])
    }
    return time
  }

  _resolveHourCost(action: { hourCost?: number; dayCost?: number }): number {
    if (typeof action.hourCost === 'number' && action.hourCost > 0) return action.hourCost
    return Math.max(1, Number(action.dayCost ?? 1)) * 2
  }

  _resolveSalaryPerHour(career: Record<string, unknown> | null = null): number {
    if (!career) return 0
    if (typeof career.salaryPerHour === 'number' && career.salaryPerHour > 0) return career.salaryPerHour
    if (typeof career.salaryPerDay === 'number' && career.salaryPerDay > 0) return Math.round(career.salaryPerDay / 8)
    if (typeof career.salaryPerWeek === 'number' && career.salaryPerWeek > 0) return Math.round(career.salaryPerWeek / 40)
    return 0
  }
}

