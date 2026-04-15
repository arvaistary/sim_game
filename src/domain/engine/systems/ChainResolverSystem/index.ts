import {
  PLAYER_ENTITY,
  CHAIN_STATE_COMPONENT,
  TIME_COMPONENT,
} from '../../components'
import type { GameWorld } from '../../world'
import { ALL_CHILDHOOD_EVENTS, getChildhoodEventsByChain } from '@/domain/balance/constants/childhood-events'
import type { ChildhoodEventDef } from '@/domain/balance/types/childhood-event'
import { AgeGroup } from '@/domain/balance/actions/types'
import type { ChainStateComponent, ChainProgress, ChainStepRecord } from './index.types'

/**
 * Диапазоны возрастов для каждой возрастной группы.
 * Используется для определения подходит ли событие по возрасту.
 */
const AGE_GROUP_RANGES: Record<number, { min: number; max: number }> = {
  [AgeGroup.INFANT]:  { min: 0, max: 3 },
  [AgeGroup.TODDLER]: { min: 1, max: 3 },
  [AgeGroup.CHILD]:   { min: 4, max: 7 },
  [AgeGroup.KID]:     { min: 8, max: 12 },
  [AgeGroup.TEEN]:    { min: 13, max: 15 },
  [AgeGroup.YOUNG]:   { min: 16, max: 18 },
  [AgeGroup.ADULT]:   { min: 18, max: 100 },
}

/**
 * Система разрешения цепочек последствий
 *
 * Цепочка — это серия событий, объединённых `chainTag`.
 * Следующее событие в цепочке появляется только если:
 *   1. Предыдущее событие обработано (есть в ChainStateComponent)
 *   2. Выполнен `condition` (ID предыдущего события)
 *   3. Достигнут нужный возраст (ageGroup события)
 *
 * Цепочечные события имеют приоритет над случайными.
 */
export class ChainResolverSystem {
  private world!: GameWorld

  init(world: GameWorld): void {
    this.world = world
    this._ensureComponent()
  }

  update(_world: GameWorld, _deltaHours: number): void {
    // Цепочки разрешаются по запросу через resolveAvailableChains()
  }

  /**
   * Проверить все цепочки и вернуть события, готовые к появлению.
   *
   * Логика:
   * 1. Собрать все уникальные chainTag из ALL_CHILDHOOD_EVENTS
   * 2. Для каждого chainTag:
   *    a. Получить все события цепочки
   *    b. Если цепочка не начата — первое событие (без condition) доступно
   *    c. Если цепочка начата — найти событие, чей condition = ID последнего обработанного
   * 3. Проверить возраст для каждого кандидата
   * 4. Вернуть подходящие события
   */
  resolveAvailableChains(currentAge: number): ChildhoodEventDef[] {
    const component = this._getComponent()
    if (!component) return []

    const available: ChildhoodEventDef[] = []

    // Собрать все уникальные chainTag
    const chainTags = new Set<string>()
    for (const event of ALL_CHILDHOOD_EVENTS) {
      if (event.chainTag) {
        chainTags.add(event.chainTag)
      }
    }

    for (const chainTag of chainTags) {
      const chainEvents = getChildhoodEventsByChain(chainTag)
      if (chainEvents.length === 0) continue

      const progress = component.chains[chainTag]

      if (!progress || progress.steps.length === 0) {
        // Цепочка не начата — ищем первое событие (без condition)
        const firstEvent = chainEvents.find(e => !e.condition)
        if (firstEvent && this._isAgeAppropriate(firstEvent, currentAge)) {
          available.push(firstEvent)
        }
      } else {
        // Цепочка начата — ищем следующее событие
        const lastStep = progress.steps[progress.steps.length - 1]
        const nextEvent = chainEvents.find(e => e.condition === lastStep.eventId)
        if (nextEvent && this._isAgeAppropriate(nextEvent, currentAge)) {
          // Проверяем что это событие ещё не было обработано
          const alreadyProcessed = progress.steps.some(s => s.eventId === nextEvent.id)
          if (!alreadyProcessed) {
            available.push(nextEvent)
          }
        }
      }
    }

    return available
  }

  /**
   * Записать что событие цепочки обработано.
   * Вызывается из EventChoiceSystem после обработки выбора.
   */
  markChainEventProcessed(chainTag: string, eventId: string, choiceIndex: number): void {
    const component = this._getComponent()
    if (!component) return

    if (!component.chains[chainTag]) {
      component.chains[chainTag] = {
        chainTag,
        steps: [],
      }
    }

    const currentAge = this._getCurrentAge()
    const gameDay = this._getCurrentGameDay()

    const step: ChainStepRecord = {
      eventId,
      choiceIndex,
      age: currentAge ?? 0,
      gameDay,
    }

    component.chains[chainTag].steps.push(step)
  }

  /**
   * Получить прогресс по цепочке.
   */
  getChainProgress(chainTag: string): ChainProgress | null {
    const component = this._getComponent()
    if (!component) return null
    return component.chains[chainTag] ?? null
  }

  /**
   * Получить прогресс по всем цепочкам.
   */
  getAllChainProgress(): Record<string, ChainProgress> {
    const component = this._getComponent()
    if (!component) return {}
    return { ...component.chains }
  }

  /**
   * Проверить была ли начата цепочка.
   */
  isChainStarted(chainTag: string): boolean {
    const component = this._getComponent()
    if (!component) return false
    const progress = component.chains[chainTag]
    return !!progress && progress.steps.length > 0
  }

  /**
   * Проверить завершена ли цепочка (все события обработаны).
   */
  isChainCompleted(chainTag: string): boolean {
    const component = this._getComponent()
    if (!component) return false

    const progress = component.chains[chainTag]
    if (!progress || progress.steps.length === 0) return false

    const chainEvents = getChildhoodEventsByChain(chainTag)
    return progress.steps.length >= chainEvents.length
  }

  // ─── Приватные методы ─────────────────────────────────────────────

  /**
   * Проверить подходит ли событие по возрасту.
   */
  private _isAgeAppropriate(event: ChildhoodEventDef, currentAge: number): boolean {
    const range = AGE_GROUP_RANGES[event.ageGroup]
    if (!range) return true // Если диапазон неизвестен — разрешаем
    return currentAge >= range.min && currentAge <= range.max
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
   * Получить или создать компонент chain_state.
   */
  private _ensureComponent(): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, CHAIN_STATE_COMPONENT)
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, CHAIN_STATE_COMPONENT, {
        chains: {},
      })
    }
  }

  /**
   * Получить компонент chain_state.
   */
  private _getComponent(): ChainStateComponent | null {
    return this.world.getComponent(PLAYER_ENTITY, CHAIN_STATE_COMPONENT) as ChainStateComponent | null
  }
}
