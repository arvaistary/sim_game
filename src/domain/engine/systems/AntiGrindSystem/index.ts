import { PLAYER_ENTITY, ACTION_HISTORY_COMPONENT } from '../../components/index'
import type { GameWorld } from '../../world'

/**
 * Интерфейс для отслеживания истории действий
 */
interface ActionHistoryEntry {
  actionId: string
  timestamp: number // totalHours
  category: string
}

/**
 * Система anti-grind для действий
 * Предотвращает спам однотипными действиями через diminishing returns
 */
export class AntiGrindSystem {
  private world!: GameWorld
  private readonly DIMINISHING_RETURNS_THRESHOLD = 3 // Количество повторений до снижения эффекта
  private readonly DIMINISHING_RETURNS_FACTOR = 0.7 // Коэффициент снижения эффекта
  private readonly RECOVERY_HOURS = 24 // Часы для восстановления эффективности

  init(world: GameWorld): void {
    this.world = world
    this._ensureComponent()
  }

  /**
   * Получает множитель эффекта для действия на основе истории
   * @param actionId - ID действия
   * @param category - Категория действия
   * @returns Множитель от 0.1 до 1.0
   */
  getEffectMultiplier(actionId: string, category: string): number {
    const history = this._getActionHistory()
    const now = this._getCurrentHours()
    
    // Фильтруем историю: только последние 24 часа
    const recentHistory = history.filter(entry => 
      now - entry.timestamp < this.RECOVERY_HOURS
    )

    // Считаем повторения этого же действия
    const sameActionCount = recentHistory.filter(entry => entry.actionId === actionId).length
    
    // Считаем повторения действий той же категории
    const sameCategoryCount = recentHistory.filter(entry => entry.category === category).length

    // Вычисляем множитель
    let multiplier = 1.0

    // Снижение за повторение того же действия
    if (sameActionCount >= this.DIMINISHING_RETURNS_THRESHOLD) {
      const excess = sameActionCount - this.DIMINISHING_RETURNS_THRESHOLD + 1
      multiplier *= Math.pow(this.DIMINISHING_RETURNS_FACTOR, excess)
    }

    // Дополнительное снижение за повторение той же категории
    if (sameCategoryCount >= this.DIMINISHING_RETURNS_THRESHOLD * 2) {
      const excess = sameCategoryCount - (this.DIMINISHING_RETURNS_THRESHOLD * 2) + 1
      multiplier *= Math.pow(this.DIMINISHING_RETURNS_FACTOR, excess * 0.5)
    }

    // Минимальный множитель
    return Math.max(0.1, multiplier)
  }

  /**
   * Получает описание причины снижения эффекта
   * @param actionId - ID действия
   * @param category - Категория действия
   * @returns Описание или null если нет снижения
   */
  getDiminishingReturnsReason(actionId: string, category: string): string | null {
    const history = this._getActionHistory()
    const now = this._getCurrentHours()
    
    const recentHistory = history.filter(entry => 
      now - entry.timestamp < this.RECOVERY_HOURS
    )

    const sameActionCount = recentHistory.filter(entry => entry.actionId === actionId).length
    const sameCategoryCount = recentHistory.filter(entry => entry.category === category).length

    if (sameActionCount >= this.DIMINISHING_RETURNS_THRESHOLD) {
      return `Вы уже делали это ${sameActionCount} раз за последние 24 часа. Эффект снижен.`
    }

    if (sameCategoryCount >= this.DIMINISHING_RETURNS_THRESHOLD * 2) {
      return `Вы уже делали много действий этой категории. Попробуйте что-то другое.`
    }

    return null
  }

  /**
   * Регистрирует выполнение действия
   * @param actionId - ID действия
   * @param category - Категория действия
   */
  recordAction(actionId: string, category: string): void {
    const history = this._getActionHistory()
    const now = this._getCurrentHours()

    history.push({
      actionId,
      timestamp: now,
      category,
    })

    // Очищаем старые записи (старше 48 часов)
    const cutoff = now - 48
    const filtered = history.filter(entry => entry.timestamp > cutoff)
    
    // Сохраняем не более 100 записей
    if (filtered.length > 100) {
      filtered.splice(0, filtered.length - 100)
    }

    this._setActionHistory(filtered)
  }

  /**
   * Получает статистику повторений для UI
   * @param actionId - ID действия
   * @param category - Категория действия
   */
  getActionStats(actionId: string, category: string): {
    sameActionCount: number
    sameCategoryCount: number
    effectMultiplier: number
    reason: string | null
  } {
    const history = this._getActionHistory()
    const now = this._getCurrentHours()
    
    const recentHistory = history.filter(entry => 
      now - entry.timestamp < this.RECOVERY_HOURS
    )

    const sameActionCount = recentHistory.filter(entry => entry.actionId === actionId).length
    const sameCategoryCount = recentHistory.filter(entry => entry.category === category).length
    const effectMultiplier = this.getEffectMultiplier(actionId, category)
    const reason = this.getDiminishingReturnsReason(actionId, category)

    return {
      sameActionCount,
      sameCategoryCount,
      effectMultiplier,
      reason,
    }
  }

  /**
   * Сбрасывает историю действий
   */
  resetHistory(): void {
    this._setActionHistory([])
  }

  private _getActionHistory(): ActionHistoryEntry[] {
    const component = this.world.getComponent(PLAYER_ENTITY, ACTION_HISTORY_COMPONENT) as Record<string, unknown> | null
    return (component?.history as ActionHistoryEntry[]) || []
  }

  private _setActionHistory(history: ActionHistoryEntry[]): void {
    this._ensureComponent()
    const component = this.world.getComponent(PLAYER_ENTITY, ACTION_HISTORY_COMPONENT) as Record<string, unknown>
    if (component) {
      component.history = history
    }
  }

  private _getCurrentHours(): number {
    const time = this.world.getComponent(PLAYER_ENTITY, 'time') as Record<string, unknown> | null
    return (time?.totalHours as number) ?? 0
  }

  private _ensureComponent(): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, ACTION_HISTORY_COMPONENT)
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, ACTION_HISTORY_COMPONENT, { history: [] })
    }
  }
}
