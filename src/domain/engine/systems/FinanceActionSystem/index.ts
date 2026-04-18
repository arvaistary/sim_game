import {
  CAREER_COMPONENT,
  TIME_COMPONENT,
  WALLET_COMPONENT,
  FINANCE_COMPONENT,
  STATS_COMPONENT,
  HOUSING_COMPONENT,
  SUBSCRIPTION_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import { SkillsSystem } from '../SkillsSystem'
import { TimeSystem } from '../TimeSystem'
import { StatsSystem } from '../StatsSystem'
import { summarizeStatChanges } from '../../utils/stat-change-summary'
import { getActionsByCategory } from '../../../balance/actions'
import type { BalanceAction } from '../../../balance/actions'
import { AgeGroup } from '../../../balance/actions/types'
import { getAgeGroup } from '../../../../composables/useAgeRestrictions/age-constants'
import type { GameWorld } from '../../world'
import type { StatChanges } from '@/domain/balance/types'
import type { FinanceOverview, FinanceActionResult, FinanceActionWithAvailability } from './index.types'

const INVESTMENT_ACTIONS = new Set([
  'fin_deposit',
  'fin_stocks',
  'fin_iis',
  'fin_business_invest',
  'fin_crypto',
  'fin_savings_account',
  'fin_pif',
  'fin_edu_invest',
])

const RESERVE_ACTIONS: Record<string, number> = {
  fin_reserve: 10000,
  fin_safety_fund: 10000,
}

export class FinanceActionSystem {
  private world!: GameWorld
  private skillsSystem!: SkillsSystem
  private timeSystem!: TimeSystem
  private statsSystem!: StatsSystem

  init(world: GameWorld): void {
    this.world = world
    this.skillsSystem = this._resolveSkillsSystem()
    this.skillsSystem.init(world)
    this.timeSystem = this._resolveTimeSystem(world)
    this.statsSystem = this._resolveStatsSystem()
  }

  private _getFinanceActions() {
    return getActionsByCategory('finance')
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

  private _resolveStatsSystem(): StatsSystem {
    const existing = this.world.getSystem(StatsSystem)
    if (existing) return existing
    const created = new StatsSystem()
    created.init(this.world)
    return created
  }

  private _getPlayerAge(): number {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
    const age = (time?.currentAge as number)
    if (age == null || age <= 0) return 25
    return age
  }

  private _checkAge(action: BalanceAction): { ok: boolean; reason?: string } {
    if (action.ageGroup === undefined) return { ok: true }
    const currentAge = this._getPlayerAge()
    const currentAgeGroup = getAgeGroup(currentAge)
    if (currentAgeGroup < action.ageGroup) {
      const minAge = this._getMinAgeForAgeGroup(action.ageGroup)
      return { ok: false, reason: `Доступно с ${minAge} лет.` }
    }
    return { ok: true }
  }

  private _getMinAgeForAgeGroup(group: AgeGroup): number {
    const map: Record<number, number> = {
      [AgeGroup.INFANT]: 0,
      [AgeGroup.TODDLER]: 4,
      [AgeGroup.CHILD]: 8,
      [AgeGroup.TEEN]: 13,
      [AgeGroup.YOUNG]: 16,
      [AgeGroup.ADULT]: 19,
    }
    return map[group] ?? 0
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
    const financeActions = this._getFinanceActions()

    return financeActions.map((action) => {
      const cost = this._resolveHourCost(action)
      const weekBlocked =
        time && typeof (time as Record<string, unknown>).weekHoursRemaining === 'number' && cost > ((time as Record<string, unknown>).weekHoursRemaining as number)
      const ageCheck = this._checkAge(action)
      const available = overview.liquidMoney >= action.price && !weekBlocked && ageCheck.ok
      let reason = ''
      if (!ageCheck.ok) {
        reason = ageCheck.reason || ''
      } else if (overview.liquidMoney < action.price) {
        reason = `Нужно ${this._formatMoney(action.price)} ₽ свободных денег.`
      } else if (weekBlocked) {
        reason = `Недостаточно времени в неделе. Нужно ${cost} ч., осталось ${(time as Record<string, unknown>).weekHoursRemaining} ч.`
      }
      return {
        ...action,
        subtitle: action.mood || '',
        amount: action.price,
        dayCost: Math.ceil(action.hourCost / 2),
        accentKey: 'blue',
        description: action.effect,
        available,
        reason,
      }
    })
  }

  applyFinanceAction(actionId: string): FinanceActionResult {
    const financeActions = this._getFinanceActions()
    const action = financeActions.find(item => item.id === actionId)
    if (!action) {
      return { success: false, message: 'Финансовое действие не найдено.' }
    }

    const ageCheck = this._checkAge(action)
    if (!ageCheck.ok) {
      return { success: false, message: ageCheck.reason || 'Недостаточно возраста.' }
    }

    const playerId = PLAYER_ENTITY
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT) as Record<string, number> | null
    const finance = this.world.getComponent(playerId, FINANCE_COMPONENT) as Record<string, unknown> | null

    if (!wallet || !finance) {
      return { success: false, message: 'Не удалось загрузить финансовые данные.' }
    }

    if (wallet.money < action.price) {
      return { success: false, message: `Недостаточно свободных денег. Нужно ${this._formatMoney(action.price)} ₽.` }
    }

    const timePrecheck = this._normalizePlayerTime()
    const hourCost = this._resolveHourCost(action)
    if (timePrecheck && typeof (timePrecheck as Record<string, unknown>).weekHoursRemaining === 'number' && hourCost > ((timePrecheck as Record<string, unknown>).weekHoursRemaining as number)) {
      return {
        success: false,
        message: `Недостаточно времени в неделе. Нужно ${hourCost} ч., осталось ${(timePrecheck as Record<string, unknown>).weekHoursRemaining} ч.`,
      }
    }

    this._applyFinanceEffect(action, wallet, finance)

    if (action.statChanges) {
      this.statsSystem.applyStatChanges(action.statChanges)
    }

    if (action.skillChanges) {
      this.skillsSystem.applySkillChanges(action.skillChanges, `finance:${action.id}`)
    }

    const cost = this._resolveHourCost(action)
    this.timeSystem.advanceHours(cost, { actionType: 'finance_action' })

    if (this.world && this.world.eventBus) {
      const financeCategory = action.id === 'fin_reserve' || action.id === 'fin_safety_fund' ? 'expense'
        : INVESTMENT_ACTIONS.has(action.id) ? 'purchase'
        : 'expense'
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:finance', {
        detail: {
          category: financeCategory,
          title: `💰 ${action.title}`,
          description: action.effect || action.title,
          icon: null,
          metadata: {
            amount: action.price,
            item: action.id,
            balance: wallet.money,
          },
        },
      }))
    }

    const message = [
      `${action.title} выполнено.`,
      action.effect,
      this._summarizeStatChanges(action.statChanges),
    ].filter(Boolean).join('\n')

    return { success: true, message }
  }

  private _applyFinanceEffect(
    action: BalanceAction,
    wallet: Record<string, number>,
    finance: Record<string, unknown>,
  ): void {
    const playerId = PLAYER_ENTITY

    if (RESERVE_ACTIONS[action.id] || action.reserveDelta) {
      wallet.money -= action.price
      const delta = action.reserveDelta ?? RESERVE_ACTIONS[action.id] ?? 0
      finance.reserveFund = Math.max(0, ((finance.reserveFund as number) ?? 0) + delta)
      return
    }

    if (INVESTMENT_ACTIONS.has(action.id)) {
      wallet.money -= action.price
      this._openInvestment(action)
      return
    }

    if (action.id === 'fin_budget' || action.monthlyExpenseDelta) {
      wallet.money -= action.price
      const monthlyExpenses = finance.monthlyExpenses as Record<string, number>
      if (action.monthlyExpenseDelta) {
        Object.entries(action.monthlyExpenseDelta).forEach(([key, value]) => {
          const currentValue = monthlyExpenses[key] ?? 0
          monthlyExpenses[key] = Math.max(0, currentValue + (value as number))
        })
      }
      return
    }

    if (action.id === 'fin_pay_debt') {
      wallet.money -= action.price
      return
    }

    if (action.id === 'fin_sell_stuff') {
      const saleIncome = Math.round(2000 + Math.random() * 3000)
      wallet.money += saleIncome
      return
    }

    if (action.id === 'fin_take_credit') {
      const creditAmount = 100000 + Math.round(Math.random() * 150000)
      wallet.money += creditAmount
      const monthlyExpenses = finance.monthlyExpenses as Record<string, number>
      monthlyExpenses.credit_payment = (monthlyExpenses.credit_payment ?? 0) + Math.round(creditAmount / 36)
      return
    }

    if (action.id === 'fin_insurance') {
      wallet.money -= action.price
      if (action.subscription) {
        const subs = this.world.getComponent(playerId, SUBSCRIPTION_COMPONENT) as Record<string, unknown> | null
        if (subs) {
          const active = (subs.active as Array<Record<string, unknown>>) ?? []
          active.push({
            id: action.id,
            name: action.title,
            costPerMonth: action.subscription.monthlyCost,
            startDay: (this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown>)?.gameDays ?? 0,
          })
          subs.active = active
        }
      }
      return
    }

    if (action.id === 'fin_rent_out') {
      const monthlyExpenses = finance.monthlyExpenses as Record<string, number>
      monthlyExpenses.rental_income = (monthlyExpenses.rental_income ?? 0) - 15000
      return
    }

    if (action.id === 'fin_pay_mortgage') {
      const monthlyExpenses = finance.monthlyExpenses as Record<string, number>
      if (monthlyExpenses.credit_payment && monthlyExpenses.credit_payment > 0) {
        monthlyExpenses.credit_payment = Math.max(0, monthlyExpenses.credit_payment - 5000)
      }
      return
    }

    if (action.id === 'fin_buy_realty') {
      wallet.money -= action.price
      if (action.housingComfortDelta) {
        const housing = this.world.getComponent(playerId, HOUSING_COMPONENT) as Record<string, unknown> | null
        if (housing) {
          housing.comfort = ((housing.comfort as number) ?? 0) + action.housingComfortDelta
        }
      }
      return
    }

    if (action.id === 'fin_auto_savings') {
      if (action.subscription) {
        const subs = this.world.getComponent(playerId, SUBSCRIPTION_COMPONENT) as Record<string, unknown> | null
        if (subs) {
          const active = (subs.active as Array<Record<string, unknown>>) ?? []
          active.push({
            id: action.id,
            name: action.title,
            costPerMonth: action.subscription.monthlyCost,
            startDay: (this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown>)?.gameDays ?? 0,
          })
          subs.active = active
        }
      }
      return
    }

    if (action.id === 'fin_expense_analysis') {
      const monthlyExpenses = finance.monthlyExpenses as Record<string, number>
      const savings = Math.round(
        (monthlyExpenses.leisure ?? 0) * 0.08
        + (monthlyExpenses.food ?? 0) * 0.05
        + (monthlyExpenses.transport ?? 0) * 0.03,
      )
      if (savings > 0) {
        monthlyExpenses.leisure = Math.max(0, (monthlyExpenses.leisure ?? 0) - Math.round(savings * 0.5))
        monthlyExpenses.food = Math.max(0, (monthlyExpenses.food ?? 0) - Math.round(savings * 0.3))
        monthlyExpenses.transport = Math.max(0, (monthlyExpenses.transport ?? 0) - Math.round(savings * 0.2))
      }
      return
    }

    if (action.price > 0) {
      wallet.money -= action.price
    }
  }

  _openInvestment(action: BalanceAction): void {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const rawInvestments = this.world.getComponent(playerId, 'investment')
    const investments = Array.isArray(rawInvestments) ? rawInvestments : [] as Array<Record<string, unknown>>

    const newInvestment: Record<string, unknown> = {
      id: `deposit_${investments.length + 1}`,
      type: 'deposit',
      label: action.title,
      amount: action.price,
      startDate: time?.gameDays,
      durationDays: action.investmentDurationDays ?? 28,
      maturityDay: (time?.gameDays as number) + (action.investmentDurationDays ?? 28),
      expectedReturn: Math.round((action.investmentReturn ?? 0) * (this.skillsSystem.getModifiers().investmentReturnMultiplier ?? 1)),
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
