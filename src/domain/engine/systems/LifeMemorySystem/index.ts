import {
  PLAYER_ENTITY,
  LIFE_MEMORY_COMPONENT,
  TIME_COMPONENT,
} from '../../components'
import type { GameWorld } from '../../world'
import type { LifeMemoryEntry, LifeMemoryComponent } from '@/domain/balance/types/life-memory'

let _nextMemoryId = 0

/**
 * Система памяти персонажа
 *
 * Записывает все значимые события в жизнь персонажа.
 * Память влияет на будущие выборы и события:
 *   - childhoodScore определяет общий эмоциональный фон детства
 *   - hasMemory() проверяет наличие воспоминания для условных событий
 *   - getMemories() возвращает отфильтрованные воспоминания
 *
 * Подписывается на доменное событие `delayed_effect:triggered`
 * для автоматической записи памяти при срабатывании отложенных последствий.
 */
export class LifeMemorySystem {
  private world!: GameWorld
  private _unsubscribeDelayedEffect: (() => void) | null = null

  init(world: GameWorld): void {
    this.world = world
    this._ensureComponent()
    this._subscribeToDelayedEffects()
  }

  update(_world: GameWorld, _deltaHours: number): void {
    // Память — система, управляемая событиями; нет периодической логики
  }

  /**
   * Записать воспоминание.
   * Автоматически заполняет gameDay из TIME_COMPONENT.
   * Пересчитывает childhoodScore.
   */
  recordMemory(entry: Omit<LifeMemoryEntry, 'gameDay'>): LifeMemoryEntry {
    const component = this._getComponent()
    if (!component) {
      throw new Error('[LifeMemorySystem] Компонент life_memory не инициализирован')
    }

    const gameDay = this._getCurrentGameDay()

    const fullEntry: LifeMemoryEntry = {
      ...entry,
      gameDay,
    }

    component.memories.push(fullEntry)
    this._recalculateChildhoodScore(component)

    return fullEntry
  }

  /**
   * Получить воспоминания с опциональной фильтрацией.
   */
  getMemories(filter?: {
    tag?: string
    minAge?: number
    maxAge?: number
    activeOnly?: boolean
  }): LifeMemoryEntry[] {
    const component = this._getComponent()
    if (!component) return []

    let result = component.memories

    if (filter) {
      if (filter.tag) {
        result = result.filter(m => m.tags.includes(filter.tag!))
      }
      if (filter.minAge !== undefined) {
        result = result.filter(m => m.age >= filter.minAge!)
      }
      if (filter.maxAge !== undefined) {
        result = result.filter(m => m.age <= filter.maxAge!)
      }
      if (filter.activeOnly) {
        result = result.filter(m => m.active)
      }
    }

    return result
  }

  /**
   * Получить общий эмоциональный фон детства.
   * Среднее emotionalWeight всех записей до 18 лет.
   */
  getChildhoodScore(): number {
    const component = this._getComponent()
    if (!component) return 0
    return component.childhoodScore
  }

  /**
   * Проверить наличие воспоминания по ID.
   * Используется для условных событий (например, «если помнишь X — появляется выбор Y»).
   */
  hasMemory(memoryId: string): boolean {
    const component = this._getComponent()
    if (!component) return false
    return component.memories.some(m => m.id === memoryId)
  }

  /**
   * Получить воспоминание по ID.
   */
  getMemoryById(memoryId: string): LifeMemoryEntry | undefined {
    const component = this._getComponent()
    if (!component) return undefined
    return component.memories.find(m => m.id === memoryId)
  }

  /**
   * Получить все теги из воспоминаний.
   */
  getAllTags(): string[] {
    const component = this._getComponent()
    if (!component) return []
    const tagSet = new Set<string>()
    component.memories.forEach(m => m.tags.forEach(t => tagSet.add(t)))
    return [...tagSet]
  }

  /**
   * Деактивировать воспоминание (перестаёт влиять на выборы).
   */
  deactivateMemory(memoryId: string): boolean {
    const component = this._getComponent()
    if (!component) return false
    const memory = component.memories.find(m => m.id === memoryId)
    if (!memory) return false
    memory.active = false
    return true
  }

  // ─── Приватные методы ─────────────────────────────────────────────

  /**
   * Подписаться на доменное событие delayed_effect:triggered.
   * При срабатывании отложенного последствия с memoryId — записать воспоминание.
   */
  private _subscribeToDelayedEffects(): void {
    this._unsubscribeDelayedEffect = this.world.onDomainEvent<{
      id: string
      sourceEventId: string
      description: string
      statChanges: Record<string, number> | null
      skillChanges: Record<string, number> | null
      grantTrait: string | null
      memoryId: string | null
    }>('delayed_effect:triggered', (payload) => {
      if (!payload.memoryId) return

      const currentAge = this._getCurrentAge()
      if (currentAge === null) return

      this.recordMemory({
        id: payload.memoryId,
        age: currentAge,
        summary: payload.description,
        emotionalWeight: this._calculateEmotionalWeight(payload.statChanges),
        tags: ['delayed_effect', payload.sourceEventId].filter(Boolean),
        sourceEventId: payload.sourceEventId,
        active: true,
      })
    })
  }

  /**
   * Пересчитать childhoodScore — среднее emotionalWeight записей до 18 лет.
   */
  private _recalculateChildhoodScore(component: LifeMemoryComponent): void {
    const childhoodMemories = component.memories.filter(m => m.age <= 18)

    if (childhoodMemories.length === 0) {
      component.childhoodScore = 0
      return
    }

    const sum = childhoodMemories.reduce((acc, m) => acc + m.emotionalWeight, 0)
    component.childhoodScore = Math.round(sum / childhoodMemories.length)
  }

  /**
   * Вычислить эмоциональный вес на основе изменений характеристик.
   */
  private _calculateEmotionalWeight(statChanges: Record<string, number> | null | undefined): number {
    if (!statChanges) return 0

    let weight = 0
    for (const value of Object.values(statChanges)) {
      if (typeof value === 'number') {
        weight += value
      }
    }

    // Нормализация к диапазону -100..+100
    return Math.max(-100, Math.min(100, Math.round(weight)))
  }

  /**
   * Получить текущий возраст персонажа.
   */
  private _getCurrentAge(): number | null {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
    if (!time) return null
    const age = time.currentAge as number | undefined
    return age !== undefined ? age : null
  }

  /**
   * Получить текущий игровой день.
   */
  private _getCurrentGameDay(): number {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
    if (!time) return 0
    return (time.gameDays as number) ?? 0
  }

  /**
   * Получить или создать компонент life_memory.
   */
  private _ensureComponent(): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, LIFE_MEMORY_COMPONENT)
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, LIFE_MEMORY_COMPONENT, {
        memories: [],
        childhoodScore: 0,
      })
    }
  }

  /**
   * Получить компонент life_memory.
   */
  private _getComponent(): LifeMemoryComponent | null {
    return this.world.getComponent(PLAYER_ENTITY, LIFE_MEMORY_COMPONENT) as LifeMemoryComponent | null
  }
}
