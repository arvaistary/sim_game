import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  addEventToQueue,
  clearEventQueue,
  hasSeenEvent,
  markEventSeen,
  pushEventHistoryEntry,
  resetEvents,
  shiftNextEvent,
} from '@/domain/game-world/commands'
import type { GameEventPayload } from '@/domain/game-world/commands/commands.types'

describe('domain events mutations', () => {
  it('addEventToQueue: добавляет событие в pending', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const event: GameEventPayload = { id: 'ev_1', title: 'Test' }

    const result: boolean = addEventToQueue(world, 'inst_1', event)

    expect(result).toBe(true)
    expect(world.events.pending).toHaveLength(1)
  })

  it('addEventToQueue: отклоняет дубликаты по instanceId', () => {
    const world: GameWorld = GameWorld.createEmpty()
    markEventSeen(world, 'inst_1')

    const result: boolean = addEventToQueue(world, 'inst_1', { id: 'ev_1' })

    expect(result).toBe(false)
    expect(world.events.pending).toHaveLength(0)
  })

  it('addEventToQueue: отклоняет дубликаты в pending по instanceId', () => {
    const world: GameWorld = GameWorld.createEmpty()

    addEventToQueue(world, 'inst_1', { id: 'ev_1', instanceId: 'inst_1' })
    const duplicateResult: boolean = addEventToQueue(world, 'inst_1', { id: 'ev_1_copy', instanceId: 'inst_1' })

    expect(duplicateResult).toBe(false)
    expect(world.events.pending).toHaveLength(1)
  })

  it('addEventToQueue: ограничивает очередь до MAX_EVENT_QUEUE', () => {
    const world: GameWorld = GameWorld.createEmpty()

    for (let i: number = 0; i < 15; i++) {
      addEventToQueue(world, `inst_${i}`, { id: `ev_${i}` })
    }

    expect(world.events.pending).toHaveLength(10)
  })

  it('markEventSeen: добавляет в seenEventIds без дубликатов', () => {
    const world: GameWorld = GameWorld.createEmpty()

    markEventSeen(world, 'inst_1')
    markEventSeen(world, 'inst_1')

    expect(world.events.state.seenEventIds).toHaveLength(1)
    expect(hasSeenEvent(world, 'inst_1')).toBe(true)
  })

  it('shiftNextEvent: возвращает первый элемент и удаляет его (FIFO)', () => {
    const world: GameWorld = GameWorld.createEmpty()
    addEventToQueue(world, 'inst_1', { id: 'ev_1' })
    addEventToQueue(world, 'inst_2', { id: 'ev_2' })

    const first: unknown | null = shiftNextEvent(world)

    expect(first).toEqual({ id: 'ev_1' })
    expect(world.events.pending).toHaveLength(1)
  })

  it('shiftNextEvent: возвращает null для пустой очереди', () => {
    const world: GameWorld = GameWorld.createEmpty()

    const result: unknown | null = shiftNextEvent(world)

    expect(result).toBeNull()
  })

  it('pushEventHistoryEntry: добавляет запись и обрезает до MAX', () => {
    const world: GameWorld = GameWorld.createEmpty()

    for (let i: number = 0; i < 60; i++) {
      pushEventHistoryEntry(world, {
        instanceId: `inst_${i}`,
        templateId: `ev_${i}`,
        day: i,
      })
    }

    expect(world.events.history).toHaveLength(50)
    expect(world.events.history[0]).toMatchObject({ templateId: 'ev_10' })
  })

  it('pushEventHistoryEntry: сохраняет choice поля', () => {
    const world: GameWorld = GameWorld.createEmpty()

    pushEventHistoryEntry(world, {
      instanceId: 'inst_1',
      templateId: 'ev_1',
      choiceId: 'choice_a',
      choiceText: 'Выбрал А',
      effects: { mood: 10 },
    })

    expect(world.events.history[0]).toMatchObject({
      choiceId: 'choice_a',
      choiceText: 'Выбрал А',
    })
  })

  it('clearEventQueue: очищает pending', () => {
    const world: GameWorld = GameWorld.createEmpty()
    addEventToQueue(world, 'inst_1', { id: 'ev_1' })

    clearEventQueue(world)

    expect(world.events.pending).toHaveLength(0)
  })

  it('hasSeenEvent: проверяет наличие в seenEventIds', () => {
    const world: GameWorld = GameWorld.createEmpty()
    markEventSeen(world, 'inst_1')

    expect(hasSeenEvent(world, 'inst_1')).toBe(true)
    expect(hasSeenEvent(world, 'unknown')).toBe(false)
  })

  it('resetEvents: сбрасывает все события', () => {
    const world: GameWorld = GameWorld.createEmpty()
    addEventToQueue(world, 'inst_1', { id: 'ev_1' })
    markEventSeen(world, 'inst_1')
    pushEventHistoryEntry(world, { instanceId: 'inst_1', templateId: 'ev_1' })

    resetEvents(world)

    expect(world.events.pending).toHaveLength(0)
    expect(world.events.history).toHaveLength(0)
    expect(world.events.state.seenEventIds).toHaveLength(0)
  })
})
