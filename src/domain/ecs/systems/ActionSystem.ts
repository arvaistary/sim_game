import { getActionById, getActionsByCategory, getAllActions } from '../../balance/actions/index'
import { calculateStatChanges } from '../../balance/hourly-rates'
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
} from '../components/index'
import { StatsSystem } from './StatsSystem'
import { SkillsSystem } from './SkillsSystem'
import { resolveActionLogDescription } from '../policies/activity-log-description'
import type { ECSWorld } from '../world'
import type { StatChanges } from '@/domain/balance/types'

interface ActionData {
  id: string
  title?: string
  label?: string
  name?: string
  price: number
  hourCost: number
  dayCost?: number
  actionType?: string
  actionSource?: string
  category?: string
  icon?: string | null
  effect?: string
  statChanges?: StatChanges
  skillChanges?: Record<string, number>
  oneTime?: boolean
  cooldown?: { hours: number }
  requirements?: {
    minAge?: number
    minSkills?: Record<string, number>
    housingLevel?: number
    requiresItem?: string
    requiresRelationship?: boolean
  }
  housingComfortDelta?: number
  housingUpgradeLevel?: number
  relationshipDelta?: number
  reserveDelta?: number
  subscription?: {
    monthlyCost: number
    effectPerWeek?: {
      statChanges?: StatChanges
      skillChanges?: Record<string, number>
    } | null
  }
  grantsItem?: string
}

interface AvailabilityCheck {
  available: boolean
  reason?: string
}

interface ExecuteResult {
  success: boolean
  summary?: string
  error?: string
}

/**
 * Система выполнения действий игрока
 * Обрабатывает покупки, развлечения, дом, обучение, соц. жизнь, финансы
 * Следует ECS-архитектуре: читает/пишет компоненты через world.getComponent/addComponent
 */
export class ActionSystem {
  private world!: ECSWorld
  private statsSystem!: StatsSystem
  private skillsSystem!: SkillsSystem

  init(world: ECSWorld): void {
    this.world = world

    this.statsSystem = new StatsSystem()
    this.statsSystem.init(world)
    this.skillsSystem = new SkillsSystem()
    this.skillsSystem.init(world)

    this._ensureComponent(SUBSCRIPTION_COMPONENT, { items: [] })
    this._ensureComponent(COOLDOWN_COMPONENT, {})
    this._ensureComponent(COMPLETED_ACTIONS_COMPONENT, { items: [] })
  }

  canExecute(actionId: string): AvailabilityCheck {
    const action = getActionById(actionId) as ActionData | null
    if (!action) return { available: false, reason: 'Действие не найдено' }

    if (action.price > 0) {
      const wallet = this.world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as Record<string, number> | null
      const money = wallet?.money ?? 0
      if (money < action.price) {
        return { available: false, reason: `Не хватает денег (${action.price}₽)` }
      }
    }

    const timeSystem = this._getTimeSystem()
    if (timeSystem) {
      const fn = timeSystem['getWeekHoursRemaining']
      if (typeof fn === 'function') {
        const weekLeft = (fn as () => number)()
        if (action.hourCost > weekLeft) {
          return {
            available: false,
            reason: `Не хватает времени в неделе (${action.hourCost} ч нужно, ${Number(weekLeft.toFixed(1))} ч осталось)`,
          }
        }
      }
    }

    if (action.oneTime) {
      const completedActions = this.world.getComponent(PLAYER_ENTITY, COMPLETED_ACTIONS_COMPONENT) as Record<string, unknown> | null
      const items = (completedActions?.items as string[]) || []
      if (items.includes(actionId)) {
        return { available: false, reason: 'Уже выполнено' }
      }
    }

    if (action.cooldown) {
      const cooldowns = this.world.getComponent(PLAYER_ENTITY, COOLDOWN_COMPONENT) as Record<string, number> | null
      if (cooldowns?.[actionId]) {
        const ts = this._getTimeSystem()
        if (ts) {
          const getTotalHours = ts['getTotalHours']
          if (typeof getTotalHours === 'function') {
            const elapsed = (getTotalHours as () => number)() - cooldowns[actionId]
            if (elapsed < action.cooldown.hours) {
              const remaining = action.cooldown.hours - elapsed
              return { available: false, reason: `Кулдаун: ${remaining.toFixed(0)}ч осталось` }
            }
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
          return { available: false, reason: `Нужен возраст ${req.minAge}+` }
        }
      }

      if (req.minSkills) {
        const skills = this.world.getComponent(PLAYER_ENTITY, SKILLS_COMPONENT) as Record<string, number> | null
        for (const [skillKey, minValue] of Object.entries(req.minSkills)) {
          if ((skills?.[skillKey] ?? 0) < minValue) {
            return { available: false, reason: `Нужен навык ${skillKey} ≥ ${minValue}` }
          }
        }
      }

      if (req.housingLevel) {
        const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT) as Record<string, unknown> | null
        if (((housing?.level as number) ?? 0) < req.housingLevel) {
          return { available: false, reason: `Нужен уровень жилья ≥ ${req.housingLevel}` }
        }
      }

      if (req.requiresItem) {
        const items = this._getFurnitureItems()
        if (!items.some(item => item.id === req.requiresItem)) {
          return { available: false, reason: `Нужен предмет: ${req.requiresItem}` }
        }
      }

      if (req.requiresRelationship) {
        const relationships = this.world.getComponent(PLAYER_ENTITY, RELATIONSHIPS_COMPONENT) as Array<Record<string, unknown>> | Record<string, unknown> | null
        const hasRelationship = Array.isArray(relationships)
          ? relationships.length > 0 && ((relationships[0]?.level as number) ?? 0) > 0
          : ((relationships as Record<string, unknown> | null)?.level as number) > 0
        if (!hasRelationship) {
          return { available: false, reason: 'Нужны отношения' }
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

    const statChanges = calculateStatChanges(
      action.actionType || 'neutral',
      action.hourCost,
      action.statChanges || {},
      modifiers as unknown as Record<string, number>,
      currentAge,
      sleepDebt
    ) as StatChanges

    this.statsSystem.applyStatChanges(statChanges)

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
    if (timeSystem && timeSystem.advanceHours) {
      const isSleep = (action.actionType || '') === 'sleep'
      ;(timeSystem.advanceHours as (h: number, opts: Record<string, unknown>) => void)(action.hourCost, {
        actionType: isSleep ? 'sleep' : 'default',
        sleepHours: isSleep ? action.hourCost : 0,
      })
    }

    if (action.cooldown) {
      const cooldowns = this.world.getComponent(PLAYER_ENTITY, COOLDOWN_COMPONENT) as Record<string, number> | null
      if (cooldowns) {
        cooldowns[actionId] = timeSystem ? (timeSystem.getTotalHours as () => number)() : 0
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

    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:action', {
        detail: {
          category: action.category || action.actionSource || 'general',
          title: `📝 ${action.title || action.label || action.name || action.id}`,
          description: normalizedDescription || action.effect || '',
          icon: action.icon || null,
          metadata: { actionId: action.id, ...actionEntryDraft.metadata },
        },
      }))
    }

    return {
      success: true,
      summary: normalizedDescription || action.effect,
    }
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

  _getTimeSystem(): Record<string, unknown> | null {
    return this.world.systems.find(s => typeof (s as Record<string, unknown>).advanceHours === 'function') as Record<string, unknown> | null || null
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

  _clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value))
  }
}

