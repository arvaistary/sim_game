import {
  WALLET_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  HOUSING_COMPONENT,
  FINANCE_COMPONENT,
  EVENT_QUEUE_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import { SkillsSystem } from '../SkillsSystem'
import { EventHistorySystem } from '../EventHistorySystem'
import { summarizeStatChanges } from '../../utils/stat-change-summary'
import type { GameWorld } from '../../world'
import type { StatChanges } from '@/domain/balance/types'
import type { RuntimeEventChoice, RuntimeGameEvent, EventChoiceResult, ResolvedChoice } from './index.types'

/**
 * Система обработки выборов событий
 * Применяет последствия выборов событий к состоянию игрока
 */
export class EventChoiceSystem {
  private world!: GameWorld
  private skillsSystem!: SkillsSystem
  private eventHistorySystem!: EventHistorySystem
  private choiceHandlers: Map<string, unknown> = new Map()

  init(world: GameWorld): void {
    this.world = world
    this.skillsSystem = new SkillsSystem()
    this.skillsSystem.init(world)
    this.eventHistorySystem = this._resolveEventHistorySystem()
  }

  private _resolveEventHistorySystem(): EventHistorySystem {
    const existing = this.world.getSystem(EventHistorySystem)
    if (existing) return existing
    const created = new EventHistorySystem()
    this.world.addSystem(created)
    return created
  }

  applyEventChoice(event: RuntimeGameEvent, choiceIndex: number): EventChoiceResult {
    const choice = event?.choices?.[choiceIndex]
    if (!event || !choice) {
      return { success: false, message: 'Событие или вариант не найдены.' }
    }

    const playerId = PLAYER_ENTITY
    const resolvedChoice = this._resolveChoiceBySkillCheck(choice, event) as ResolvedChoice
    const mergedStatChanges = this._mergeStatImpactWithChoice(event, resolvedChoice.statChanges)
    const resolvedForMessage = { ...resolvedChoice, statChanges: mergedStatChanges }

    if (resolvedChoice.moneyDelta !== undefined) {
      const wallet = this.world.getComponent(playerId, WALLET_COMPONENT) as Record<string, number> | null
      if (wallet) {
        wallet.money += resolvedChoice.moneyDelta
        if (resolvedChoice.moneyDelta > 0) {
          wallet.totalEarnings = (wallet.totalEarnings ?? 0) + resolvedChoice.moneyDelta
        } else if (resolvedChoice.moneyDelta < 0) {
          wallet.totalSpent = (wallet.totalSpent ?? 0) + Math.abs(resolvedChoice.moneyDelta)
        }
      }
    }

    if (mergedStatChanges && Object.keys(mergedStatChanges).length > 0) {
      const stats = this.world.getComponent(playerId, STATS_COMPONENT) as Record<string, number> | null
      if (stats) {
        this._applyStatChanges(stats, this._applyEventModifiers(mergedStatChanges))
      }
    }

    if (resolvedChoice.skillChanges) {
      this.skillsSystem.applySkillChanges(resolvedChoice.skillChanges, `event:${event.id}`)
    }

    if (resolvedChoice.relationshipDelta) {
      const relationships = this.world.getComponent(playerId, 'relationships') as Array<Record<string, number>> | null
      if (relationships && relationships.length > 0) {
        this._applyRelationshipDelta(relationships[0], resolvedChoice.relationshipDelta)
      }
    }

    if (resolvedChoice.monthlyExpenseDelta) {
      const finance = this.world.getComponent(playerId, FINANCE_COMPONENT) as Record<string, unknown> | null
      if (finance && finance.monthlyExpenses) {
        const monthlyExpenses = finance.monthlyExpenses as Record<string, number>
        Object.entries(resolvedChoice.monthlyExpenseDelta).forEach(([key, value]) => {
          const currentValue = monthlyExpenses[key] ?? 0
          monthlyExpenses[key] = Math.max(0, currentValue + value)
        })
      }
    }

    if (resolvedChoice.housingLevelDelta) {
      const housing = this.world.getComponent(playerId, HOUSING_COMPONENT) as Record<string, unknown> | null
      if (housing) {
        this._applyHousingLevelDelta(housing, resolvedChoice.housingLevelDelta)
      }
    }

    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:event', {
        detail: {
          category: event.type || event.actionSource || 'random',
          title: `⚡ ${event.title}`,
          description: `${event.description || event.title} → ${choice.text || choice.outcome || ''}`,
          icon: null,
          metadata: {
            eventId: event.id,
            instanceId: event.instanceId,
            choiceIndex,
            choiceText: choice.text || choice.outcome || '',
            statChanges: mergedStatChanges && Object.keys(mergedStatChanges).length ? mergedStatChanges : null,
            moneyDelta: resolvedChoice.moneyDelta || 0,
            skillChanges: resolvedChoice.skillChanges || null,
          },
        },
      }))
    }

    this._recordEvent(event.id, event.title ?? '', event.type ?? 'story', event.actionSource ?? null)

    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT) as Record<string, unknown> | null
    if (eventQueue && eventQueue.pendingEvents) {
      const index = (eventQueue.pendingEvents as Array<Record<string, unknown>>).findIndex(
        (e) => e.instanceId === event.instanceId || e.id === event.id,
      )
      if (index > -1) {
        (eventQueue.pendingEvents as Array<Record<string, unknown>>).splice(index, 1)
      }
    }

    const message = this._buildEventResultMessage(event, resolvedForMessage)

    return { success: true, message }
  }

  _mergeStatImpactWithChoice(event: RuntimeGameEvent, choiceStatChanges?: StatChanges): Record<string, number> {
    const base =
      event?.statImpact && typeof event.statImpact === 'object' ? { ...event.statImpact } as Record<string, number> : {} as Record<string, number>
    const extra =
      choiceStatChanges && typeof choiceStatChanges === 'object' ? choiceStatChanges as Record<string, number> : {} as Record<string, number>
    const merged: Record<string, number> = { ...base }
    for (const [k, v] of Object.entries(extra)) {
      if (typeof v === 'number' && typeof merged[k] === 'number') {
        merged[k] = merged[k] + v
      } else {
        merged[k] = v as number
      }
    }
    return merged
  }

  _recordEvent(eventId: string, title: string, type = 'story', actionSource: string | null = null): void {
    this.eventHistorySystem.recordEvent(eventId, title, type, actionSource)
  }

  _applyStatChanges(stats: Record<string, number>, statChanges: Record<string, number> = {}): void {
    for (const [key, value] of Object.entries(statChanges)) {
      stats[key] = this._clamp((stats[key] ?? 0) + value)
    }
  }

  _applyEventModifiers(statChanges: Record<string, number> = {}): Record<string, number> {
    const reduction = this.skillsSystem.getModifiers().negativeEventPenaltyReduction ?? 0
    const adjusted: Record<string, number> = {}

    for (const [key, value] of Object.entries(statChanges)) {
      adjusted[key] = typeof value === 'number' && value < 0
        ? Math.round(value * (1 - reduction))
        : value
    }

    return adjusted
  }

  _applyRelationshipDelta(relationship: Record<string, number>, delta: number): void {
    if (!relationship) {
      return
    }
    relationship.level = this._clamp((relationship.level ?? 0) + delta)
  }

  _applyHousingLevelDelta(housing: Record<string, unknown>, delta: number): void {
    const currentLevel = (housing.level as number) ?? 1
    const newLevel = Math.max(1, Math.min(3, currentLevel + delta))

    housing.level = newLevel
    const housingLevels = [
      { level: 1, name: 'Студия', baseComfort: 35, monthlyHousingCost: 16000 },
      { level: 2, name: '1-комнатная квартира', baseComfort: 52, monthlyHousingCost: 26000 },
      { level: 3, name: 'Уютная квартира', baseComfort: 72, monthlyHousingCost: 38000 },
    ]

    const tier = housingLevels.find(t => t.level === newLevel) || housingLevels[0]
    housing.name = tier.name
    housing.comfort = Math.max((housing.comfort as number) ?? 0, tier.baseComfort)

    const finance = this.world.getComponent(PLAYER_ENTITY, FINANCE_COMPONENT) as Record<string, unknown> | null
    if (finance && finance.monthlyExpenses) {
      (finance.monthlyExpenses as Record<string, number>).housing = tier.monthlyHousingCost
    }
  }

  _buildEventResultMessage(event: RuntimeGameEvent, choice: ResolvedChoice): string {
    const lines: string[] = [
      `${event.title}`,
      choice.outcome,
    ]

    if (choice.statChanges) {
      lines.push(this._summarizeStatChanges(choice.statChanges))
    }

    if (choice.moneyDelta !== undefined && choice.moneyDelta !== 0) {
      lines.push(`Деньги ${choice.moneyDelta > 0 ? '+' : ''}${this._formatMoney(choice.moneyDelta)} ₽`)
    }

    if (choice.skillChanges) {
      const skillLines = Object.entries(choice.skillChanges)
        .map(([key, value]) => `${key}: ${value > 0 ? '+' : ''}${value}`)
        .join(' • ')
      if (skillLines) {
        lines.push(`Навыки: ${skillLines}`)
      }
    }

    return lines.filter(Boolean).join('\n')
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

  _resolveChoiceBySkillCheck(choice: RuntimeEventChoice, event: RuntimeGameEvent | null = null): ResolvedChoice {
    if (!choice?.skillCheck) {
      return {
        ...choice,
        outcome: choice.outcome ?? '',
        statChanges: choice.statChanges ?? {},
      }
    }

    const check = choice.skillCheck
    const skillValue = this.skillsSystem.getSkillLevel(check.key)
    const passed = skillValue >= Number(check.threshold ?? 0)

    if (passed && this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:prevented', {
        detail: {
          category: 'skill_prevented',
          title: `🛡️ Навык предотвратил: ${event?.title || 'Событие'}`,
          description: `Навык "${check.key}" (${skillValue}) превысил порог ${check.threshold}. Исход изменён.`,
          icon: null,
          metadata: {
            eventId: event?.id || null,
            skillName: check.key,
            skillLevel: skillValue,
            threshold: Number(check.threshold ?? 0),
            originalOutcome: choice.outcome || '',
            newOutcome: check.successStatChanges ? JSON.stringify(check.successStatChanges) : '',
          },
        },
      }))
    }

    return {
      ...choice,
      statChanges: passed ? (check.successStatChanges ?? choice.statChanges ?? {}) : (check.failStatChanges ?? choice.statChanges ?? {}),
      moneyDelta: passed ? (check.successMoneyDelta ?? choice.moneyDelta) : (check.failMoneyDelta ?? choice.moneyDelta),
      outcome: `${choice.outcome}${passed ? ' Удалось справиться.' : ' Подготовки не хватило.'}`,
    }
  }
}

