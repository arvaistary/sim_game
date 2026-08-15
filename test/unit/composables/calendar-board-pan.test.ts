import { describe, expect, it } from 'vitest'

import {
  CALENDAR_BOARD_PAN_HINT_KEY,
  blendCalendarBoardPanVelocity,
  canStartCalendarBoardPan,
  dismissCalendarBoardPanHint,
  isCalendarBoardPanHintVisible,
  stepCalendarBoardInertia,
} from '@/composables/useCalendarPlan/calendar-board-pan'
import type {
  CalendarBoardInertiaStep,
  CalendarBoardPanStartInput,
  CalendarBoardPanStorage,
} from '@/composables/useCalendarPlan/calendar-board-pan.types'

function createMemoryStorage(initial: Record<string, string> = {}): CalendarBoardPanStorage {
  const values: Record<string, string> = { ...initial }

  return {
    getItem(key: string): string | null {
      return values[key] ?? null
    },
    setItem(key: string, value: string): void {
      values[key] = value
    },
  }
}

describe('calendar board pan', () => {
  it('starts a mouse pan on empty board space', () => {
    const input: CalendarBoardPanStartInput = {
      pointerType: 'mouse',
      button: 0,
      isInsideBoard: true,
      isInsideBlockedControl: false,
    }

    expect(canStartCalendarBoardPan(input)).toBe(true)
  })

  it('does not steal pan from action cards or controls', () => {
    const onCard: CalendarBoardPanStartInput = {
      pointerType: 'mouse',
      button: 0,
      isInsideBoard: true,
      isInsideBlockedControl: true,
    }

    expect(canStartCalendarBoardPan(onCard)).toBe(false)
  })

  it('leaves native swipe to touch and ignores non-primary mouse buttons', () => {
    const touch: CalendarBoardPanStartInput = {
      pointerType: 'touch',
      button: 0,
      isInsideBoard: true,
      isInsideBlockedControl: false,
    }
    const rightClick: CalendarBoardPanStartInput = {
      pointerType: 'mouse',
      button: 2,
      isInsideBoard: true,
      isInsideBlockedControl: false,
    }

    expect(canStartCalendarBoardPan(touch)).toBe(false)
    expect(canStartCalendarBoardPan(rightClick)).toBe(false)
  })

  it('shows the pan hint until it is dismissed', () => {
    const storage: CalendarBoardPanStorage = createMemoryStorage()

    expect(isCalendarBoardPanHintVisible(storage)).toBe(true)

    dismissCalendarBoardPanHint(storage)

    expect(storage.getItem(CALENDAR_BOARD_PAN_HINT_KEY)).toBe('1')
    expect(isCalendarBoardPanHintVisible(storage)).toBe(false)
  })

  it('blends pointer samples into a stable scroll velocity', () => {
    const previous: number = blendCalendarBoardPanVelocity({
      previousVelocityPxPerMs: 0,
      deltaPx: -16,
      elapsedMs: 16,
      smoothing: 0.5,
    })

    expect(previous).toBe(-0.5)

    const blended: number = blendCalendarBoardPanVelocity({
      previousVelocityPxPerMs: previous,
      deltaPx: -16,
      elapsedMs: 0,
      smoothing: 0.5,
    })

    expect(blended).toBe(previous)
  })

  it('coasts with friction and stops at the edge without snapping', () => {
    const mid: CalendarBoardInertiaStep = stepCalendarBoardInertia({
      scrollLeft: 100,
      velocityPxPerMs: 1,
      elapsedMs: 16.67,
      maxScrollLeft: 800,
      friction: 0.92,
      stopVelocity: 0.02,
    })

    expect(mid.isStopped).toBe(false)
    expect(mid.scrollLeft).toBeGreaterThan(100)
    expect(Math.abs(mid.velocityPxPerMs)).toBeLessThan(1)

    const edge: CalendarBoardInertiaStep = stepCalendarBoardInertia({
      scrollLeft: 798,
      velocityPxPerMs: 1,
      elapsedMs: 16.67,
      maxScrollLeft: 800,
      friction: 0.92,
      stopVelocity: 0.02,
    })

    expect(edge.scrollLeft).toBe(800)
    expect(edge.velocityPxPerMs).toBe(0)
    expect(edge.isStopped).toBe(true)
  })
})
