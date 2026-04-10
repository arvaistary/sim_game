import {
  TIME_COMPONENT,
  WALLET_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import type { GameWorld } from '../../world'
import type { InvestmentConfig, InvestmentRecord, InvestmentWithState, InvestmentResult } from './index.types'

/**
 * Система управления инвестициями
 * Обрабатывает открытие, отслеживание и закрытие вкладов
 */
export class InvestmentSystem {
  private world!: GameWorld
  private investments: InvestmentRecord[] = []

  init(world: GameWorld): void {
    this.world = world
  }

  openInvestment(config: InvestmentConfig): InvestmentResult {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const investments = this._getInvestmentsArray(playerId)

    if (!time) {
      return { success: false, message: 'Не удалось загрузить время игры.' }
    }

    const durationDays = config.durationDays ?? 28
    const newInvestment: InvestmentRecord = {
      id: config.id || `deposit_${investments.length + 1}`,
      type: config.type || 'deposit',
      label: config.label,
      amount: config.amount,
      startDate: time.gameDays as number,
      durationDays,
      maturityDay: (time.gameDays as number) + durationDays,
      expectedReturn: config.expectedReturn ?? 0,
      totalEarned: 0,
      status: 'active',
    }

    investments.push(newInvestment)
    this.world.updateComponent(playerId, 'investment', investments as unknown as Record<string, unknown>)

    return {
      success: true,
      message: `Инвестиция "${config.label}" открыта на ${this._formatMoney(config.amount)} ₽.`,
      investment: newInvestment
    }
  }

  collectInvestment(investmentId: string): InvestmentResult {
    const playerId = PLAYER_ENTITY
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT) as Record<string, number> | null
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const investments = this._getInvestmentsArray(playerId)

    if (!wallet || !time) {
      return { success: false, message: 'Не удалось загрузить данные.' }
    }

    const investment = investments.find(item => item.id === investmentId)
    if (!investment) {
      return { success: false, message: 'Инвестиция не найдена.' }
    }

    const state = this._getInvestmentState(investment, time.gameDays as number)
    if (state === 'closed') {
      return { success: false, message: 'Эта инвестиция уже закрыта.' }
    }

    if (state !== 'matured') {
      const maturityDay = investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28))
      const daysLeft = Math.max(0, maturityDay - (time.gameDays as number))
      return { success: false, message: `Пока рано. До закрытия вклада осталось ${daysLeft} д.` }
    }

    const payoutAmount = (investment.amount ?? 0) + (investment.expectedReturn ?? 0)
    wallet.money += payoutAmount
    wallet.totalEarnings += investment.expectedReturn ?? 0
    investment.totalEarned = (investment.totalEarned ?? 0) + (investment.expectedReturn ?? 0)
    investment.closedAt = time.gameDays as number
    investment.status = 'closed'

    this.world.updateComponent(playerId, 'investment', investments as unknown as Record<string, unknown>)

    return {
      success: true,
      message: [
        `${investment.label || 'Инвестиция'} закрыта.`,
        `Возвращено ${this._formatMoney(payoutAmount)} ₽, из них доход ${this._formatMoney(investment.expectedReturn ?? 0)} ₽.`,
      ].join('\n')
    }
  }

  getAllInvestments(): InvestmentWithState[] {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    const investments = this._getInvestmentsArray(playerId)

    if (!time) {
      return []
    }

    return investments.map((investment) => {
      const state = this._getInvestmentState(investment, time.gameDays as number)
      const maturityDay = investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28))
      return {
        ...investment,
        state,
        maturityDay,
        daysLeft: Math.max(0, maturityDay - (time.gameDays as number)),
        payoutAmount: (investment.amount ?? 0) + (investment.expectedReturn ?? 0),
      }
    })
  }

  getActiveInvestments(): InvestmentWithState[] {
    const allInvestments = this.getAllInvestments()
    return allInvestments.filter(investment => investment.state !== 'closed')
  }

  getMaturedInvestments(): InvestmentWithState[] {
    const allInvestments = this.getAllInvestments()
    return allInvestments.filter(investment => investment.state === 'matured')
  }

  _getInvestmentState(investment: InvestmentRecord, currentDay: number): string {
    if (investment.status === 'closed') {
      return 'closed'
    }

    const maturityDay = investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28))
    if (currentDay >= maturityDay) {
      return 'matured'
    }

    return 'active'
  }

  _formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  _getInvestmentsArray(playerId: string): InvestmentRecord[] {
    const raw = this.world.getComponent(playerId, 'investment')
    if (Array.isArray(raw)) return raw as InvestmentRecord[]
    return []
  }
}

