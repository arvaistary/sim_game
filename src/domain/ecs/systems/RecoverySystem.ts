import {
  TIME_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  WALLET_COMPONENT,
  HOUSING_COMPONENT,
  FURNITURE_COMPONENT,
  RELATIONSHIPS_COMPONENT,
  EDUCATION_COMPONENT,
  CAREER_COMPONENT,
  PLAYER_ENTITY,
} from '../components/index'
import { HOUSING_LEVELS } from '../../balance/housing-levels'
import { summarizeStatChanges } from '../policies/stat-change-summary'
import { SkillsSystem } from './SkillsSystem'
import type { ECSWorld } from '../world'
import type { RecoveryCard } from '@/domain/balance/types'

/**
 * Система обработки действий восстановления
 */
export class RecoverySystem {
  private world!: ECSWorld
  private skillsSystem!: SkillsSystem
  private housingLevels = HOUSING_LEVELS

  init(world: ECSWorld): void {
    this.world = world
    this.skillsSystem = new SkillsSystem()
    this.skillsSystem.init(world)
  }

  recover(playerId: string, tab: { cards?: RecoveryCard[] }, cardId?: string): string {
    if (!tab?.cards?.length) return ''
    const card =
      tab.cards.find((c) => (c as RecoveryCard & { id?: string }).id === cardId) ||
      tab.cards.find((c) => c.title === cardId) ||
      null
    if (!card) return ''
    return this.applyRecoveryAction(card)
  }

  applyRecoveryAction(cardData: RecoveryCard): string {
    const playerId = PLAYER_ENTITY

    const passive = this._getPassiveBonuses()
    const rawStatChanges = cardData.statChanges ?? {}
    const statChanges: Record<string, number> = {}
    for (const [k, v] of Object.entries(rawStatChanges)) {
      if (typeof v === 'number') statChanges[k] = v
    }
    const cardAny = cardData as unknown as Record<string, unknown>
    const isAssetTransfer = Boolean(cardAny.reserveDelta || cardAny.investmentReturn)

    if (cardData.title.includes('перекус') || cardData.title.includes('обед')) {
      statChanges.hunger = Math.round((statChanges.hunger ?? 0) * passive.foodRecoveryMultiplier)
    }

    if (cardData.title === 'Вечер дома') {
      statChanges.mood = (statChanges.mood ?? 0) + passive.homeMoodBonus
    }

    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT) as Record<string, number>
    wallet.money -= cardData.price

    if (!isAssetTransfer) {
      wallet.totalSpent += cardData.price
    }

    const stats = this.world.getComponent(playerId, STATS_COMPONENT) as Record<string, number>
    this._applyStatChanges(stats, statChanges)

    if (cardData.skillChanges) {
      this._applySkillChanges(cardData.skillChanges, 'recovery')
    }

    if (cardData.housingComfortDelta) {
      const housing = this.world.getComponent(playerId, HOUSING_COMPONENT) as Record<string, unknown>
      housing.comfort = this._clamp((housing.comfort as number) + cardData.housingComfortDelta)
    }

    if (cardData.housingUpgradeLevel) {
      this._upgradeHousing(cardData.housingUpgradeLevel)
    }

    if (cardData.furnitureId) {
      this._addFurniture(cardData.furnitureId)
    }

    const relationshipDelta = (cardData as unknown as Record<string, unknown>).relationshipDelta as number | undefined
    if (relationshipDelta) {
      this._applyRelationshipDelta(relationshipDelta)
    }

    const reserveDelta = (cardData as unknown as Record<string, unknown>).reserveDelta as number | undefined
    if (reserveDelta) {
      const finance = this.world.getComponent(playerId, 'finance') as Record<string, unknown>
      finance.reserveFund = Math.max(0, ((finance?.reserveFund as number) ?? 0) + reserveDelta)
    }

    const investmentReturn = (cardData as unknown as Record<string, unknown>).investmentReturn as number | undefined
    if (investmentReturn) {
      this._openInvestment(cardData)
    }

    if (cardData.salaryMultiplierDelta) {
      const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown>
      const baseSalaryPerHour = this._resolveSalaryPerHour(career)
      career.salaryPerHour = Math.round(baseSalaryPerHour * (1 + cardData.salaryMultiplierDelta))
      career.salaryPerDay = Math.round((career.salaryPerHour as number) * 8)
      career.salaryPerWeek = Math.round((career.salaryPerHour as number) * 40)
    }

    if (cardData.educationLevel) {
      const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown>
      education.educationLevel = cardData.educationLevel
      education.institute = 'completed'
    }

    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown>
    const hourCost = this._resolveHourCost(cardData)
    const actionType = this._resolveActionType(cardData)
    const systems = this.world.systems as Array<Record<string, unknown>>
    const timeSystem = systems.find((system) => typeof system.advanceHours === 'function') as Record<string, unknown> | undefined
    if (timeSystem) {
      ;(timeSystem.advanceHours as (h: number, opts: Record<string, unknown>) => void)(hourCost, {
        actionType,
        sleepHours: actionType === 'sleep' ? hourCost : 0,
      })
    } else {
      time.totalHours = ((time.totalHours as number) ?? ((time.gameDays as number) ?? 0) * 24) + hourCost
    }

    return this._buildRecoverySummary(cardData, statChanges, hourCost)
  }

  _getPassiveBonuses(): { foodRecoveryMultiplier: number; workEnergyMultiplier: number; homeMoodBonus: number } {
    const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT) as Record<string, unknown> | null
    const comfortRatio = this._clamp(((housing?.comfort as number) ?? 0) / 100, 0, 1)
    const housingLevel = (housing?.level as number) ?? 1
    const furniture = (this.world.getComponent(PLAYER_ENTITY, FURNITURE_COMPONENT) || []) as Array<Record<string, unknown>>

    return {
      foodRecoveryMultiplier: (this._hasFurniture(furniture, 'refrigerator') ? 1.2 : 1) + comfortRatio * 0.08,
      workEnergyMultiplier: Math.max(0.78, (this._hasFurniture(furniture, 'good_bed') ? 0.9 : 1) - comfortRatio * 0.08 - (housingLevel - 1) * 0.02),
      homeMoodBonus: (this._hasFurniture(furniture, 'decor_light') ? 6 : 1) + Math.round(comfortRatio * 4) + (housingLevel - 1) * 2,
    }
  }

  _hasFurniture(furniture: Array<Record<string, unknown>>, furnitureId: string): boolean {
    return Boolean(furniture?.some(item => item.id === furnitureId))
  }

  _upgradeHousing(targetLevel: number): void {
    const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT) as Record<string, unknown>
    const finance = this.world.getComponent(PLAYER_ENTITY, 'finance') as Record<string, unknown>

    const tier = this.housingLevels.find(item => item.level === targetLevel)
    if (!tier) return

    housing.level = tier.level
    housing.name = tier.name
    housing.comfort = Math.max((housing.comfort as number), tier.baseComfort)
    ;(finance.monthlyExpenses as Record<string, number>).housing = tier.monthlyHousingCost
  }

  _addFurniture(furnitureId: string): void {
    const furniture = (this.world.getComponent(PLAYER_ENTITY, FURNITURE_COMPONENT) || []) as Array<Record<string, unknown>>
    const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT) as Record<string, unknown>

    if (!this._hasFurniture(furniture, furnitureId)) {
      furniture.push({ id: furnitureId, level: 1 })
      this.world.updateComponent(PLAYER_ENTITY, FURNITURE_COMPONENT, furniture as unknown as Record<string, unknown>)
    }
  }

  _applyRelationshipDelta(delta: number): void {
    if (!delta) return

    const relationships = this.world.getComponent(PLAYER_ENTITY, RELATIONSHIPS_COMPONENT) as Array<Record<string, unknown>> | null
    if (!relationships || !relationships.length) return

    const firstRelationship = relationships[0]
    firstRelationship.level = this._clamp((firstRelationship.level as number) + delta)
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
    firstRelationship.lastContact = time.gameDays
  }

  _openInvestment(cardData: RecoveryCard): void {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
    const investments = (this.world.getComponent(PLAYER_ENTITY, 'investment') || []) as Array<Record<string, unknown>>

    const investmentDurationDays = (cardData as unknown as Record<string, unknown>).investmentDurationDays as number ?? 28
    const investmentReturn = (cardData as unknown as Record<string, unknown>).investmentReturn as number ?? 0

    const newInvestment: Record<string, unknown> = {
      id: `deposit_${investments.length + 1}`,
      type: 'deposit',
      label: cardData.title,
      amount: cardData.price,
      startDate: time.gameDays,
      durationDays: investmentDurationDays,
      maturityDay: (time.gameDays as number) + investmentDurationDays,
      expectedReturn: Math.round(investmentReturn * (this.skillsSystem.getModifiers().investmentReturnMultiplier ?? 1)),
      totalEarned: 0,
      status: 'active',
    }

    investments.push(newInvestment)
    this.world.updateComponent(PLAYER_ENTITY, 'investment', investments as unknown as Record<string, unknown>)
  }

  _buildRecoverySummary(cardData: RecoveryCard, statChanges: Record<string, number>, hourCost: number): string {
    const changes = this._summarizeStatChanges(statChanges)
    return [
      `${cardData.title} завершено.`,
      `Потрачено: ${this._formatMoney(cardData.price)} ₽`,
      `Время: ${hourCost} ч.`,
      changes || 'Шкалы без заметных изменений.',
    ].join('\n')
  }

  _summarizeStatChanges(statChanges: Record<string, number> = {}): string {
    return summarizeStatChanges(statChanges)
  }

  _applyStatChanges(stats: Record<string, number>, statChanges: Record<string, number> = {}): void {
    for (const [key, value] of Object.entries(statChanges)) {
      stats[key] = this._clamp((stats[key] ?? 1) + value)
    }
  }

  _applySkillChanges(skillChanges: Record<string, number> = {}, reason = 'recovery'): void {
    if (!skillChanges || Object.keys(skillChanges).length === 0) return
    this.skillsSystem.applySkillChanges(skillChanges, reason)
  }

  _clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value))
  }

  _formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  _resolveHourCost(cardData: RecoveryCard): number {
    if (typeof cardData.hourCost === 'number' && cardData.hourCost > 0) {
      return cardData.hourCost
    }
    const legacyDayCost = Math.max(1, Number(cardData.dayCost) || 1)
    return legacyDayCost * 2
  }

  _resolveSalaryPerHour(career: Record<string, unknown> = {}): number {
    if (typeof career.salaryPerHour === 'number' && career.salaryPerHour > 0) return career.salaryPerHour
    if (typeof career.salaryPerDay === 'number' && career.salaryPerDay > 0) return Math.round(career.salaryPerDay / 8)
    if (typeof career.salaryPerWeek === 'number' && career.salaryPerWeek > 0) return Math.round(career.salaryPerWeek / 40)
    return 0
  }

  _resolveActionType(cardData: RecoveryCard = {} as RecoveryCard): string {
    const title = String(cardData.title ?? '').toLowerCase()
    if (title.includes('сон') || title.includes('отдых дома') || title.includes('вечер дома')) return 'sleep'
    if (title.includes('продукт') || title.includes('обед') || title.includes('перекус') || title.includes('магазин')) return 'buy_groceries'
    if (title.includes('спорт')) return 'sport'
    return 'recovery_action'
  }
}

