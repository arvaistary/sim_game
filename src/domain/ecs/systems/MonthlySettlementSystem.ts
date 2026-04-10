import {
  WALLET_COMPONENT,
  FINANCE_COMPONENT,
  STATS_COMPONENT,
  EVENT_QUEUE_COMPONENT,
  EVENT_HISTORY_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY,
} from '../components/index'
import { MONTHLY_EXPENSES_DEFAULT } from '../../balance/monthly-expenses-defaults'
import {
  EVENT_FINANCE_CASH_GAP,
  EVENT_FINANCE_RESERVE_WARNING,
  cloneQueuedEventTemplate,
} from '../../balance/game-events'
import { SkillsSystem } from './SkillsSystem'
import type { ECSWorld } from '../world'
import type { StatChanges } from '@/domain/balance/types'

interface SettlementResult {
  success: boolean
  message: string
}

interface SettlementData {
  month: number
  totalCharged: number
  liquidPaid: number
  reservePaid: number
  shortage: number
  liquidAfter: number
  reserveAfter: number
}

/**
 * Система месячного расчета
 * Обрабатывает ежемесячные расходы и финансы
 */
export class MonthlySettlementSystem {
  private world!: ECSWorld
  private skillsSystem!: SkillsSystem
  private monthlyExpensesDefault: Record<string, number>

  constructor() {
    this.monthlyExpensesDefault = { ...MONTHLY_EXPENSES_DEFAULT }
  }

  init(world: ECSWorld): void {
    this.world = world
    this.skillsSystem = new SkillsSystem()
    this.skillsSystem.init(world)
  }

  applyMonthlySettlement(monthNumber: number): SettlementResult {
    const playerId = PLAYER_ENTITY
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT) as Record<string, number> | null
    const finance = this.world.getComponent(playerId, FINANCE_COMPONENT) as Record<string, unknown> | null
    const stats = this.world.getComponent(playerId, STATS_COMPONENT) as Record<string, number> | null
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null

    if (!wallet || !finance) {
      return { success: false, message: 'Не удалось загрузить финансовые данные.' }
    }

    const modifiers = this.skillsSystem.getModifiers()
    const monthlyExpenses = (finance.monthlyExpenses || { ...this.monthlyExpensesDefault }) as Record<string, number>
    const monthlyTotalBase = Object.values(monthlyExpenses).reduce((sum, value) => sum + value, 0)
    const monthlyTotal = Math.max(
      0,
      Math.round(monthlyTotalBase * (modifiers.dailyExpenseMultiplier ?? 1)) - Math.round(modifiers.passiveIncomeBonus ?? 0),
    )

    const liquidPaid = Math.min(wallet.money, monthlyTotal)
    wallet.money -= liquidPaid

    const remaining = monthlyTotal - liquidPaid
    const reservePaid = Math.min((finance.reserveFund as number) ?? 0, remaining)
    finance.reserveFund = Math.max(0, ((finance.reserveFund as number) ?? 0) - reservePaid)

    const shortage = Math.max(0, remaining - reservePaid)
    wallet.totalSpent += monthlyTotal - shortage

    if (shortage > 0) {
      if (stats) {
        this._applyStatChanges(stats, {
          stress: Math.min(18, 8 + Math.round(shortage / 10000)),
          mood: -Math.min(16, 6 + Math.round(shortage / 12000)),
          health: -Math.min(10, 3 + Math.round(shortage / 18000)),
        })
      }

      this._queuePendingEvent(cloneQueuedEventTemplate(EVENT_FINANCE_CASH_GAP) as unknown as Record<string, unknown>)
    } else if (reservePaid > 0 && stats) {
      this._applyStatChanges(stats, {
        stress: -3,
        mood: 2,
      })
    }

    const lastSettlement: SettlementData = {
      month: monthNumber,
      totalCharged: monthlyTotal,
      liquidPaid,
      reservePaid,
      shortage,
      liquidAfter: wallet.money,
      reserveAfter: (finance.reserveFund as number),
    }
    finance.lastMonthlySettlement = lastSettlement

    if (((finance.reserveFund as number) ?? 0) < monthlyTotal * 0.35) {
      this._queuePendingEvent(cloneQueuedEventTemplate(EVENT_FINANCE_RESERVE_WARNING) as unknown as Record<string, unknown>)
    }

    if (this.world && this.world.eventBus) {
      const timeComp = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:finance', {
        detail: {
          category: 'monthly_settlement',
          title: '📅 Месячный расчёт',
          description: `Доход: 0 ₽, Расходы: ${this._formatMoney(monthlyTotal)} ₽, Баланс: ${this._formatMoney(wallet.money)} ₽`,
          icon: null,
          metadata: {
            income: 0,
            expenses: monthlyTotal,
            balance: wallet.money,
            month: monthNumber,
            year: timeComp ? Math.floor(((timeComp.gameMonths as number) ?? 0) / 12) : 0,
          },
        },
      }))
    }

    const message = [
      `Месяц ${monthNumber} закрыт.`,
      `Списано: ${this._formatMoney(liquidPaid)} ₽ (личные) + ${this._formatMoney(reservePaid)} ₽ (резерв).`,
      `Дефицит: ${shortage > 0 ? this._formatMoney(shortage) + ' ₽' : 'нет'}`,
    ].join('\n')

    return { success: true, message }
  }

  _queuePendingEvent(event: Record<string, unknown>): void {    const playerId = PLAYER_ENTITY
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT) as Record<string, unknown> | null
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (!eventQueue || !eventHistory) {
      return
    }

    const instanceId = `${event.id}_${Date.now()}`
    const alreadyHandled = ((eventHistory.events as Array<Record<string, unknown>>) || []).some(item => item.eventId === instanceId)
    const alreadyQueued = ((eventQueue.pendingEvents as Array<Record<string, unknown>>) || []).some(item => item.instanceId === instanceId)

    if (alreadyHandled || alreadyQueued) {
      return
    }

    if (!eventQueue.pendingEvents) {
      eventQueue.pendingEvents = []
    }
    (eventQueue.pendingEvents as Array<Record<string, unknown>>).push({ ...event, instanceId })
  }

  _applyStatChanges(stats: Record<string, number>, statChanges: StatChanges = {}): void {
    for (const [key, value] of Object.entries(statChanges)) {
      if (value === undefined) continue
      stats[key] = this._clamp((stats[key] ?? 0) + value)
    }
  }

  _clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value))
  }

  _formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU').format(value)
  }
}

