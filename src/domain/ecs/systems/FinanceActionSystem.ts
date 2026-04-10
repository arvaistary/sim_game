import {
  CAREER_COMPONENT,
  TIME_COMPONENT,
  WALLET_COMPONENT,
  FINANCE_COMPONENT,
  STATS_COMPONENT,
  PLAYER_ENTITY,
} from '../components/index'
import { SkillsSystem } from './SkillsSystem'
import { summarizeStatChanges } from '../policies/stat-change-summary'
import type { ECSWorld } from '../world'
import type { LegacyFinanceAction, StatChanges } from '@/domain/balance/types'

const FINANCE_ACTIONS: LegacyFinanceAction[] = [
  {
    id: 'reserve_transfer',
    title: 'Пополнить резерв',
    subtitle: 'Переложить часть свободных денег в финансовую подушку.',
    amount: 10000,
    reserveDelta: 10000,
    dayCost: 1,
    hourCost: 1,
    statChanges: { stress: -6, mood: 3 },
    skillChanges: { financialLiteracy: 1 },
    accentKey: 'sage',
    description: 'Ликвидные деньги -10 000 ₽ • Резерв +10 000 ₽ • Стресс -10',
  },
  {
    id: 'open_deposit',
    title: 'Открыть вклад',
    subtitle: 'Заморозить капитал на 28 дней ради спокойного дохода.',
    amount: 50000,
    expectedReturn: 4000,
    durationDays: 28,
    dayCost: 1,
    hourCost: 2,
    statChanges: { stress: -3, mood: 2 },
    skillChanges: { financialLiteracy: 1 },
    accentKey: 'blue',
    description: 'Ликвидные деньги -50 000 ₽ • Через 28 дней можно забрать 54 000 ₽',
  },
  {
    id: 'budget_review',
    title: 'Пересобрать бюджет',
    subtitle: 'Чуть снизить тревогу и подправить ежемесячные траты.',
    amount: 0,
    dayCost: 1,
    hourCost: 1,
    statChanges: { stress: -5, mood: 2 },
    skillChanges: { financialLiteracy: 1 },
    monthlyExpenseDelta: {
      leisure: -800,
      education: 400,
    },
    accentKey: 'accent',
    description: 'Стресс -8 • Финансовая грамотность +1 • Расходы на досуг -1 000 ₽/мес',
  },
]

interface FinanceOverview {
  liquidMoney: number
  reserveFund: number
  investedTotal: number
  expectedReturnTotal: number
  monthlyIncome: number
  monthlyExpensesTotal: number
  monthlyBalance: number
  expenseLines: Array<{ id: string; label: string; amount: number }>
  investments: Array<Record<string, unknown>>
  lastMonthlySettlement: Record<string, unknown> | null
}

interface FinanceActionResult {
  success: boolean
  message: string
}

interface FinanceActionWithAvailability extends LegacyFinanceAction {
  available: boolean
  reason: string
}

/**
 * Система финансовых действий
 * Обрабатывает управление резервом, депозитами и бюджетом
 */
export class FinanceActionSystem {
  private world!: ECSWorld
  private skillsSystem!: SkillsSystem
  private financeActions: LegacyFinanceAction[] = FINANCE_ACTIONS

  init(world: ECSWorld): void {
    this.world = world
    this.skillsSystem = new SkillsSystem()
    this.skillsSystem.init(world)
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
    if (action.id === 'reserve_transfer') {
      wallet.money -= action.amount
      finance.reserveFund = Math.max(0, ((finance.reserveFund as number) ?? 0) + (action.reserveDelta ?? 0))
    }

    if (action.id === 'open_deposit') {
      wallet.money -= action.amount
      this._openInvestment(action)
    }

    if (action.id === 'budget_review') {
      const monthlyExpenses = finance.monthlyExpenses as Record<string, number>
      Object.entries(action.monthlyExpenseDelta ?? {}).forEach(([key, value]) => {
        const currentValue = monthlyExpenses[key] ?? 0
        monthlyExpenses[key] = Math.max(0, currentValue + value)
      })
    }

    if (action.statChanges) {
      const stats = this.world.getComponent(playerId, STATS_COMPONENT) as Record<string, number> | null
      if (stats) {
        this._applyStatChanges(stats, action.statChanges)
      }
    }

    if (action.skillChanges) {
      this.skillsSystem.applySkillChanges(action.skillChanges, `finance:${action.id}`)
    }

    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    if (time) {
      const timeSystem = this.world.systems.find((system) => typeof (system as Record<string, unknown>).advanceHours === 'function')
      const cost = this._resolveHourCost(action)
      if (timeSystem) {
        ;((timeSystem as Record<string, unknown>).advanceHours as (h: number, opts: Record<string, unknown>) => void)(cost, { actionType: 'finance_action' })
      } else {
        time.totalHours = ((time.totalHours as number) ?? ((time.gameDays as number) ?? 0) * 24) + cost
      }
    }

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

  _applyStatChanges(stats: Record<string, number>, statChanges: StatChanges = {}): void {
    for (const [key, value] of Object.entries(statChanges)) {
      if (value === undefined) continue
      stats[key] = this._clamp((stats[key] ?? 0) + value)
    }
  }

  _applySkillChanges(skills: Record<string, number>, skillChanges: Record<string, number> = {}): void {
    for (const [key, value] of Object.entries(skillChanges)) {
      skills[key] = this._clamp((skills[key] ?? 0) + value, 0, 10)
    }
  }

  _summarizeStatChanges(statChanges: StatChanges = {}): string {
    return summarizeStatChanges(statChanges)
  }

  _clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value))
  }

  _formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  _normalizePlayerTime(): Record<string, unknown> | null {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT)
    const timeSystem = this.world.systems?.find((s) => typeof (s as Record<string, unknown>).normalizeTimeComponent === 'function')
    if (time && timeSystem) {
      ;((timeSystem as Record<string, unknown>).normalizeTimeComponent as (t: Record<string, unknown>) => void)(time)
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

