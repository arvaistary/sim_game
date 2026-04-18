import { telemetryInc } from '../../utils/telemetry'
import { getActionById, getActionsByCategory, getAllActions } from '../../../balance/actions/index'
import { AgeGroup } from '../../../balance/actions/types'
import { calculateStatChangesWithBreakdown } from '../../../balance/utils/hourly-rates'
import {
  PLAYER_ENTITY,
  TIME_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  SKILL_MODIFIERS_COMPONENT,
  WALLET_COMPONENT,
  HOUSING_COMPONENT,
  FURNITURE_COMPONENT,
  RELATIONSHIPS_COMPONENT,
  FINANCE_COMPONENT,
  SUBSCRIPTION_COMPONENT,
  COOLDOWN_COMPONENT,
  COMPLETED_ACTIONS_COMPONENT,
} from '../../components/index'
import { StatsSystem } from '../StatsSystem'
import { SkillsSystem } from '../SkillsSystem'
import { EventQueueSystem } from '../EventQueueSystem'
import { AntiGrindSystem } from '../AntiGrindSystem'
import { resolveActionLogDescription } from '../../utils/activity-log-description'
import type { GameWorld } from '../../world'
import { TimeSystem } from '../TimeSystem'
import type { StatChanges } from '@/domain/balance/types'
import type { ActionData, AvailabilityCheck, ExecuteResult, ActionDenyReason } from './index.types'
import { getGlobalActionAvailabilityCache, type ActionAvailabilityCache } from './ActionAvailabilityCache'

/**
 * Система выполнения действий игрока
 * Обрабатывает покупки, развлечения, дом, обучение, соц. жизнь, финансы
 * Следует ECS-архитектуре: читает/пишет компоненты через world.getComponent/addComponent
 */
export class ActionSystem {
  private world!: GameWorld
  private statsSystem!: StatsSystem
  private skillsSystem!: SkillsSystem
  private eventQueueSystem!: EventQueueSystem
  private antiGrindSystem!: AntiGrindSystem
  private availabilityCache: ActionAvailabilityCache

  init(world: GameWorld): void {
    this.world = world
    this.availabilityCache = getGlobalActionAvailabilityCache()

    this.statsSystem = this._resolveStatsSystem()
    this.skillsSystem = this._resolveSkillsSystem()
    this.eventQueueSystem = this._resolveEventQueueSystem()
    this.antiGrindSystem = this._resolveAntiGrindSystem()
    this.eventQueueSystem = this._resolveEventQueueSystem()

    this._ensureComponent(SUBSCRIPTION_COMPONENT, { items: [] })
    this._ensureComponent(COOLDOWN_COMPONENT, {})
    this._ensureComponent(COMPLETED_ACTIONS_COMPONENT, { items: [] })
  }

  canExecute(actionId: string): AvailabilityCheck {
    // Проверяем кэш
    const cached = this.availabilityCache.get(actionId)
    if (cached) {
      return { available: cached.available, reason: cached.reason }
    }

    // Вычисляем доступность
    const result = this._computeAvailability(actionId)
    
    // Сохраняем в кэш
    this.availabilityCache.set(actionId, {
      available: result.available,
      reason: result.reason,
    })
    
    return result
  }

  /**
   * Вычисляет доступность действия без использования кэша
   */
  private _deny(code: ActionDenyReason, reason: string): AvailabilityCheck {
    return { available: false, reason, reasonCode: code }
  }

  private _computeAvailability(actionId: string): AvailabilityCheck {
    const action = getActionById(actionId) as ActionData | null
    if (!action) {
      telemetryInc('action_fail:not_found')
      return this._deny('not_found', 'Действие не найдено')
    }

    if (action.ageGroup !== undefined) {
      const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
      const currentAge = (time?.currentAge as number) ?? 0
      const minAgeForGroup = this._getMinAgeForAgeGroup(action.ageGroup)
      if (currentAge < minAgeForGroup) {
        telemetryInc('action_fail:age_group')
        return this._deny('age_group', `Доступно с ${minAgeForGroup} лет`)
      }
    }

    const stats = this.world.getComponent(PLAYER_ENTITY, STATS_COMPONENT) as Record<string, number> | null
    const energy = stats?.energy ?? 100
    const hunger = stats?.hunger ?? 0
    
    const isSleepAction = (action.actionType || '') === 'sleep'
    if (!isSleepAction && energy < 10) {
      telemetryInc('action_fail:no_energy')
      return this._deny('low_energy', 'Слишком мало энергии. Отдохните или поспите.')
    }
    
    const isFoodAction = (action.category || '') === 'shop' && action.title?.toLowerCase().includes('еда')
    if (!isFoodAction && hunger > 80) {
      telemetryInc('action_fail:too_hungry')
      return this._deny('high_hunger', 'Слишком голодны. Сначала поешьте.')
    }

    if (action.price > 0) {
      const wallet = this.world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as Record<string, number> | null
      const money = wallet?.money ?? 0
      if (money < action.price) {
        telemetryInc('action_fail:no_money')
        return this._deny('no_money', `Не хватает денег (${action.price}₽)`)
      }
    }

    const timeSystem = this._getTimeSystem()
    if (timeSystem) {
      const weekLeft = timeSystem.getWeekHoursRemaining()
      if (action.hourCost > weekLeft) {
        telemetryInc('action_fail:no_time')
        return this._deny('no_time', `Не хватает времени в неделе (${action.hourCost} ч нужно, ${Number(weekLeft.toFixed(1))} ч осталось)`)
      }
    }

    if (action.oneTime) {
      const completedActions = this.world.getComponent(PLAYER_ENTITY, COMPLETED_ACTIONS_COMPONENT) as Record<string, unknown> | null
      const items = (completedActions?.items as string[]) || []
      if (items.includes(actionId)) {
        telemetryInc('action_fail:already_done')
        return this._deny('one_time_used', 'Уже выполнено')
      }
    }

    if (action.cooldown) {
      const cooldowns = this.world.getComponent(PLAYER_ENTITY, COOLDOWN_COMPONENT) as Record<string, number> | null
      if (cooldowns?.[actionId]) {
        const ts = this._getTimeSystem()
        if (ts) {
          const elapsed = ts.getTotalHours() - cooldowns[actionId]
          if (elapsed < action.cooldown.hours) {
            const remaining = action.cooldown.hours - elapsed
            telemetryInc('action_fail:cooldown')
            return this._deny('cooldown', `Кулдаун: ${remaining.toFixed(0)}ч осталось`)
          }
        }
      }
    }

    if (action.requirements) {
      const req = action.requirements

      if (req.minAge) {
        const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
        const currentAge = (time?.currentAge as number) ?? 0
        if (currentAge < req.minAge) {
          telemetryInc('action_fail:min_age')
          return this._deny('min_age', `Нужен возраст ${req.minAge}+`)
        }
      }

      if (req.minSkills) {
        for (const [skillKey, minValue] of Object.entries(req.minSkills)) {
          if (!this.skillsSystem.hasSkillLevel(skillKey, minValue)) {
            telemetryInc('action_fail:min_skill')
            return this._deny('min_skills', `Нужен навык ${skillKey} ≥ ${minValue}`)
          }
        }
      }

      if (req.housingLevel) {
        const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT) as Record<string, unknown> | null
        if (((housing?.level as number) ?? 0) < req.housingLevel) {
          telemetryInc('action_fail:housing_level')
          return this._deny('housing_level', `Нужен уровень жилья ≥ ${req.housingLevel}`)
        }
      }

      if (req.requiresItem) {
        const items = this._getFurnitureItems()
        if (!items.some(item => item.id === req.requiresItem)) {
          telemetryInc('action_fail:requires_item')
          return this._deny('requires_item', `Нужен предмет: ${req.requiresItem}`)
        }
      }

      if (req.requiresRelationship) {
        const relationships = this.world.getComponent(PLAYER_ENTITY, RELATIONSHIPS_COMPONENT) as Array<Record<string, unknown>> | Record<string, unknown> | null
        const hasRelationship = Array.isArray(relationships)
          ? relationships.length > 0 && ((relationships[0]?.level as number) ?? 0) > 0
          : ((relationships as Record<string, unknown> | null)?.level as number) > 0
        if (!hasRelationship) {
          telemetryInc('action_fail:requires_relationship')
          return this._deny('requires_relationship', 'Нужны отношения')
        }
      }
    }

    return { available: true }
  }

  execute(actionId: string): ExecuteResult {
    const check = this.canExecute(actionId)
    if (!check.available) {
      return { success: false, error: check.reason }
    }

    const action = getActionById(actionId) as ActionData | null
    if (!action) return { success: false, error: 'Действие не найдено' }

    if (action.price > 0) {
      const wallet = this.world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as Record<string, number> | null
      if (wallet) {
        wallet.money -= action.price
      }
    }

    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
    const currentAge = (time?.currentAge as number) ?? 25
    const sleepDebt = (time?.sleepDebt as number) ?? 0
    const modifiers = this.skillsSystem.getModifiers()

    const { statChanges, breakdown } = calculateStatChangesWithBreakdown(
      action.actionType || 'neutral',
      action.hourCost,
      action.statChanges || {},
      modifiers as unknown as Record<string, number>,
      currentAge,
      sleepDebt,
    )

    // Применяем diminishing returns (anti-grind)
    const effectMultiplier = this.antiGrindSystem.getEffectMultiplier(actionId, action.category || 'general')
    const adjustedStatChanges: StatChanges = {}
    for (const [key, value] of Object.entries(statChanges)) {
      adjustedStatChanges[key as keyof StatChanges] = value * effectMultiplier
    }

    this.statsSystem.applyStatChanges(adjustedStatChanges)

    if (action.skillChanges) {
      this.skillsSystem.applySkillChanges(action.skillChanges, 'action')
    }

    if (action.housingComfortDelta) {
      const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT) as Record<string, number> | null
      if (housing) {
        housing.comfort = this._clamp((housing.comfort ?? 0) + action.housingComfortDelta)
      }
    }
    if (action.housingUpgradeLevel !== undefined) {
      const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT) as Record<string, unknown> | null
      if (housing) {
        housing.level = action.housingUpgradeLevel
      }
    }

    if (action.relationshipDelta) {
      const relationships = this.world.getComponent(PLAYER_ENTITY, RELATIONSHIPS_COMPONENT) as Array<Record<string, number>> | null
      if (Array.isArray(relationships) && relationships.length > 0) {
        relationships[0].level = this._clamp(relationships[0].level + action.relationshipDelta!)
      }
    }

    if (action.reserveDelta) {
      const finance = this.world.getComponent(PLAYER_ENTITY, FINANCE_COMPONENT) as Record<string, unknown> | null
      if (finance) {
        finance.reserveFund = Math.max(0, ((finance.reserveFund as number) ?? 0) + action.reserveDelta)
      }
    }

    const timeSystem = this._getTimeSystem()
    if (timeSystem) {
      const isSleep = (action.actionType || '') === 'sleep'
      timeSystem.advanceHours(action.hourCost, {
        actionType: isSleep ? 'sleep' : 'default',
        sleepHours: isSleep ? action.hourCost : 0,
      })
    }

    if (action.cooldown) {
      const cooldowns = this.world.getComponent(PLAYER_ENTITY, COOLDOWN_COMPONENT) as Record<string, number> | null
      if (cooldowns) {
        cooldowns[actionId] = timeSystem ? timeSystem.getTotalHours() : 0
      }
    }

    if (action.oneTime) {
      const completedActions = this.world.getComponent(PLAYER_ENTITY, COMPLETED_ACTIONS_COMPONENT) as Record<string, unknown> | null
      if (completedActions) {
        const items = (completedActions.items as string[]) || []
        if (!items.includes(actionId)) {
          items.push(actionId)
        }
      }
    }

    if (action.subscription) {
      const subscriptions = this.world.getComponent(PLAYER_ENTITY, SUBSCRIPTION_COMPONENT) as Record<string, unknown> | null
      const timeComp = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
      if (subscriptions) {
        const items = (subscriptions.items as Array<Record<string, unknown>>) || []
        items.push({
          actionId: actionId,
          monthlyCost: action.subscription.monthlyCost,
          effectPerWeek: action.subscription.effectPerWeek || null,
          startMonth: (timeComp?.gameMonths as number) ?? 0,
        })
      }
    }

    if (action.grantsItem) {
      this._addFurnitureItem(action.grantsItem)
    }

    const actionEntryDraft = {
      type: 'action',
      description: '',
      metadata: {
        statChanges,
        moneyDelta: -(action.price || 0),
        skillChanges: action.skillChanges || null,
        hoursSpent: action.hourCost || 0,
      },
    }
    const normalizedDescription = resolveActionLogDescription(actionEntryDraft as { description?: string; metadata?: { statChanges?: Record<string, number>; moneyDelta?: number; hoursSpent?: number } })

    // Публикуем событие через EventIngress API
    const timeComp = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
    if (timeComp) {
      this.eventQueueSystem.enqueueEvent({
        source: 'other',
        templateId: `action_${action.id}`,
        title: `📝 ${action.title || action.label || action.name || action.id}`,
        description: normalizedDescription || action.effect || '',
        type: 'info',
        priority: 'normal',
        timeSnapshot: {
          totalHours: (timeComp.totalHours as number) ?? 0,
          day: (timeComp.gameDays as number) ?? 0,
          week: (timeComp.gameWeeks as number) ?? 0,
          month: (timeComp.gameMonths as number) ?? 0,
          year: (timeComp.gameYears as number) ?? 0,
        },
        meta: {
          actionId: action.id,
          category: action.category || action.actionSource || 'general',
          ...actionEntryDraft.metadata
        },
      })
    }

    // Регистрируем действие в anti-grind системе
    this.antiGrindSystem.recordAction(actionId, action.category || 'general')

    // Инвалидируем кэш после успешного выполнения действия
    this.availabilityCache.invalidateAction(actionId)
    
    return {
      success: true,
      summary: normalizedDescription || action.effect,
      statBreakdown: breakdown,
    }
  }

  /**
   * Обновить версию мира в кэше доступности действий
   * Вызывать при изменении состояния мира (bumpWorldVersion)
   */
  updateWorldVersion(worldVersion: number): void {
    this.availabilityCache.updateWorldVersion(worldVersion)
  }

  /**
   * Получить статистику кэша доступности действий
   */
  getAvailabilityCacheStats() {
    return this.availabilityCache.getStats()
  }

  getAvailableActions(categoryId?: string): Array<ActionData & { availability: AvailabilityCheck }> {
    const actions = categoryId
      ? (getActionsByCategory(categoryId) as ActionData[])
      : (getAllActions() as ActionData[])

    return actions.map(action => ({
      ...action,
      availability: this.canExecute(action.id),
    }))
  }

  getActionById(actionId: string): ActionData | null {
    return getActionById(actionId) as ActionData | null
  }

  processSubscriptions(): void {
    const subscriptions = this.world.getComponent(PLAYER_ENTITY, SUBSCRIPTION_COMPONENT) as Record<string, unknown> | null
    if (!(subscriptions?.items as Array<Record<string, unknown>>)?.length) return

    let totalCost = 0
    for (const sub of (subscriptions!.items as Array<Record<string, unknown>>)) {
      totalCost += (sub.monthlyCost as number)

      if (sub.effectPerWeek) {
        const effect = sub.effectPerWeek as Record<string, unknown>
        if (effect.statChanges) {
          this.statsSystem.applyStatChanges(effect.statChanges as StatChanges)
        }
        if (effect.skillChanges) {
          this.skillsSystem.applySkillChanges(effect.skillChanges as Record<string, number>, 'subscription')
        }
      }
    }

    if (totalCost > 0) {
      const wallet = this.world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as Record<string, number> | null
      if (wallet) {
        wallet.money -= totalCost
      }
    }
  }

  _ensureComponent(key: string, defaultValue: Record<string, unknown>): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, key)
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, key, defaultValue)
    }
  }

  _getTimeSystem(): TimeSystem | null {
    const found = this.world.systems.find((s): s is TimeSystem => s instanceof TimeSystem)
    return found ?? null
  }

  private _resolveEventQueueSystem(): EventQueueSystem {
    const existing = this.world.getSystem(EventQueueSystem)
    if (existing) return existing
    const created = new EventQueueSystem()
    this.world.addSystem(created)
    return created
  }

  private _resolveAntiGrindSystem(): AntiGrindSystem {
    const existing = this.world.getSystem(AntiGrindSystem)
    if (existing) return existing
    const created = new AntiGrindSystem()
    this.world.addSystem(created)
    return created
  }

  private _resolveStatsSystem(): StatsSystem {
    const existing = this.world.getSystem(StatsSystem)
    if (existing) return existing
    const created = new StatsSystem()
    this.world.addSystem(created)
    return created
  }

  private _resolveSkillsSystem(): SkillsSystem {
    const existing = this.world.getSystem(SkillsSystem)
    if (existing) return existing
    const created = new SkillsSystem()
    this.world.addSystem(created)
    return created
  }

  _getFurnitureItems(): Array<Record<string, unknown>> {
    const data = this.world.getComponent(PLAYER_ENTITY, FURNITURE_COMPONENT) as Record<string, unknown> | Array<Record<string, unknown>> | null
    if (!data) return []
    if (Array.isArray(data)) return data
    return Object.values(data) as Array<Record<string, unknown>>
  }

  _addFurnitureItem(itemId: string): void {
    const items = this._getFurnitureItems()
    if (items.some(item => item.id === itemId)) return
    items.push({ id: itemId, level: 1 })
    if (!this.world.components.has(FURNITURE_COMPONENT)) {
      this.world.components.set(FURNITURE_COMPONENT, new Map())
      const entity = this.world.entities.get(PLAYER_ENTITY)
      if (entity) entity.components.add(FURNITURE_COMPONENT)
    }
    this.world.components.get(FURNITURE_COMPONENT)!.set(PLAYER_ENTITY, items as unknown as Record<string, unknown>)
  }

  _getMinAgeForAgeGroup(ageGroup: AgeGroup): number {
    // Маппинг AgeGroup на минимальный возраст
    const ageMap: Record<AgeGroup, number> = {
      [AgeGroup.INFANT]: 0,   // 0-3 года
      [AgeGroup.TODDLER]: 4,  // 4-7 лет
      [AgeGroup.CHILD]: 8,    // 8-12 лет
      [AgeGroup.KID]: 13,     // НЕ ИСПОЛЬЗУЕТСЯ, но для совместимости
      [AgeGroup.TEEN]: 13,    // 13-15 лет
      [AgeGroup.YOUNG]: 16,   // 16-18 лет
      [AgeGroup.ADULT]: 19,   // 19+ лет
    }
    return ageMap[ageGroup] ?? 0
  }

  _clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value))
  }
}


