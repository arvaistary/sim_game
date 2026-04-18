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
} from '../../components/index'
import { HOUSING_LEVELS } from '../../../balance/constants/housing-levels'
import { summarizeStatChanges } from '../../utils/stat-change-summary'
import { resolveSalaryPerHour, formatMoney } from '../../utils/career-helpers'
import { telemetryInc } from '../../utils/telemetry'
import { SkillsSystem } from '../SkillsSystem'
import { TimeSystem } from '../TimeSystem'
import { StatsSystem } from '../StatsSystem'
import { InvestmentSystem } from '../InvestmentSystem'
import type { GameWorld } from '../../world'
import type { RecoveryCard } from '@/domain/balance/types'
import type { PassiveBonuses } from './index.types'
import {
  FOOD_RECOVERY_FRIDGE_BONUS,
  FOOD_RECOVERY_BASE,
  FOOD_COMFORT_RATIO_FACTOR,
  WORK_ENERGY_MIN,
  WORK_ENERGY_BASE,
  WORK_ENERGY_GOOD_BED,
  WORK_ENERGY_COMFORT_RATIO_FACTOR,
  WORK_ENERGY_HOUSING_LEVEL_PENALTY,
  HOME_MOOD_DECOR_BONUS,
  HOME_MOOD_BASE,
  HOME_MOOD_COMFORT_RATIO_FACTOR,
  HOME_MOOD_HOUSING_LEVEL_BONUS,
} from './index.constants'

export type { PassiveBonuses }

/**
 * Система обработки действий восстановления
 *
 * Canonical wiring: все зависимости получаются через world.getSystem()
 * (системы создаются и управляются через SystemContext).
 */
export class RecoverySystem {
  private world!: GameWorld
  private skillsSystem!: SkillsSystem
  private timeSystem!: TimeSystem
  private statsSystem!: StatsSystem
  private investmentSystem!: InvestmentSystem
  private housingLevels = HOUSING_LEVELS

  init(world: GameWorld): void {
    this.world = world
    this.skillsSystem = world.getSystem(SkillsSystem)
    this.timeSystem = world.getSystem(TimeSystem)
    this.statsSystem = world.getSystem(StatsSystem)
    this.investmentSystem = world.getSystem(InvestmentSystem)
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
    this.statsSystem.applyStatChanges(statChanges)

    if (cardData.skillChanges) {
      this._applySkillChanges(cardData.skillChanges, 'recovery')
    }

    if (cardData.housingComfortDelta) {
      const housing = this.world.getComponent(playerId, HOUSING_COMPONENT) as Record<string, unknown>
      housing.comfort = Math.max(0, Math.min(100, (housing.comfort as number) + cardData.housingComfortDelta))
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
      const investmentDurationDays = (cardData as unknown as Record<string, unknown>).investmentDurationDays as number ?? 28
      this.investmentSystem.openInvestment({
        label: cardData.title,
        amount: cardData.price,
        durationDays: investmentDurationDays,
        expectedReturn: Math.round(investmentReturn * (this.skillsSystem.getModifiers().investmentReturnMultiplier ?? 1)),
      })
      telemetryInc('recovery_investment_open')
    }

    if (cardData.salaryMultiplierDelta) {
      const career = this.world.getComponent(playerId, CAREER_COMPONENT) as Record<string, unknown>
      const baseSalaryPerHour = resolveSalaryPerHour(career)
      career.salaryPerHour = Math.round(baseSalaryPerHour * (1 + cardData.salaryMultiplierDelta))
      career.salaryPerDay = Math.round((career.salaryPerHour as number) * 8)
      career.salaryPerWeek = Math.round((career.salaryPerHour as number) * 40)
    }

    if (cardData.educationLevel) {
      const education = this.world.getComponent(playerId, EDUCATION_COMPONENT) as Record<string, unknown>
      education.educationLevel = cardData.educationLevel
      education.institute = 'completed'
    }

    const hourCost = this._resolveHourCost(cardData)
    const actionType = this._resolveActionType(cardData)
    this.timeSystem.advanceHours(hourCost, {
      actionType,
      sleepHours: actionType === 'sleep' ? hourCost : 0,
    })

    telemetryInc(`recovery_action:${actionType}`)

    return this._buildRecoverySummary(cardData, statChanges, hourCost)
  }

  getPassiveBonuses(): PassiveBonuses {
    return this._getPassiveBonuses()
  }

  _getPassiveBonuses(): PassiveBonuses {
    const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT) as Record<string, unknown> | null
    const comfortRatio = Math.max(0, Math.min(1, ((housing?.comfort as number) ?? 0) / 100))
    const housingLevel = (housing?.level as number) ?? 1
    const furniture = (this.world.getComponent(PLAYER_ENTITY, FURNITURE_COMPONENT) || []) as Array<Record<string, unknown>>

    const result: PassiveBonuses = {
      foodRecoveryMultiplier:
        (this._hasFurniture(furniture, 'refrigerator') ? FOOD_RECOVERY_FRIDGE_BONUS : FOOD_RECOVERY_BASE)
        + comfortRatio * FOOD_COMFORT_RATIO_FACTOR,
      workEnergyMultiplier:
        Math.max(
          WORK_ENERGY_MIN,
          (this._hasFurniture(furniture, 'good_bed') ? WORK_ENERGY_GOOD_BED : WORK_ENERGY_BASE)
          - comfortRatio * WORK_ENERGY_COMFORT_RATIO_FACTOR
          - (housingLevel - 1) * WORK_ENERGY_HOUSING_LEVEL_PENALTY,
        ),
      homeMoodBonus:
        (this._hasFurniture(furniture, 'decor_light') ? HOME_MOOD_DECOR_BONUS : HOME_MOOD_BASE)
        + Math.round(comfortRatio * HOME_MOOD_COMFORT_RATIO_FACTOR)
        + (housingLevel - 1) * HOME_MOOD_HOUSING_LEVEL_BONUS,
    }

    telemetryInc('recovery_passive_bonus')
    return result
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

    telemetryInc('recovery_housing_upgrade')
  }

  _addFurniture(furnitureId: string): void {
    const furniture = (this.world.getComponent(PLAYER_ENTITY, FURNITURE_COMPONENT) || []) as Array<Record<string, unknown>>
    const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT) as Record<string, unknown>

    if (!this._hasFurniture(furniture, furnitureId)) {
      furniture.push({ id: furnitureId, level: 1 })
      this.world.updateComponent(PLAYER_ENTITY, FURNITURE_COMPONENT, furniture as unknown as Record<string, unknown>)
      telemetryInc('recovery_furniture_add')
    }
  }

  _applyRelationshipDelta(delta: number): void {
    if (!delta) return

    const relationships = this.world.getComponent(PLAYER_ENTITY, RELATIONSHIPS_COMPONENT) as Array<Record<string, unknown>> | null
    if (!relationships || !relationships.length) return

    const firstRelationship = relationships[0]
    firstRelationship.level = Math.max(0, Math.min(100, (firstRelationship.level as number) + delta))
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
    firstRelationship.lastContact = time.gameDays
  }

  _buildRecoverySummary(cardData: RecoveryCard, statChanges: Record<string, number>, hourCost: number): string {
    const changes = summarizeStatChanges(statChanges)
    return [
      `${cardData.title} завершено.`,
      `Потрачено: ${formatMoney(cardData.price)} ₽`,
      `Время: ${hourCost} ч.`,
      changes || 'Шкалы без заметных изменений.',
    ].join('\n')
  }

  _applySkillChanges(skillChanges: Record<string, number> = {}, reason = 'recovery'): void {
    if (!skillChanges || Object.keys(skillChanges).length === 0) return
    this.skillsSystem.applySkillChanges(skillChanges, reason)
  }

  _resolveHourCost(cardData: RecoveryCard): number {
    if (typeof cardData.hourCost === 'number' && cardData.hourCost > 0) {
      return cardData.hourCost
    }
    const legacyDayCost = Math.max(1, Number(cardData.dayCost) || 1)
    return legacyDayCost * 2
  }

  _resolveActionType(cardData: RecoveryCard = {} as RecoveryCard): string {
    const title = String(cardData.title ?? '').toLowerCase()
    if (title.includes('сон') || title.includes('отдых дома') || title.includes('вечер дома')) return 'sleep'
    if (title.includes('продукт') || title.includes('обед') || title.includes('перекус') || title.includes('магазин')) return 'buy_groceries'
    if (title.includes('спорт')) return 'sport'
    return 'recovery_action'
  }
}
