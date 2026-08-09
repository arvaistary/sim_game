import { describe, expect, it } from 'vitest'

import {
  EVENT_FINANCE_CASH_GAP,
  EVENT_FINANCE_RESERVE_WARNING,
  GLOBAL_PROGRESS_EVENTS,
  MICRO_EVENT_CHOICES_BY_ID,
  WEEKLY_BONUS_MOMENT_EVENT,
  WORK_RANDOM_EVENTS,
  createWeeklySummaryQueuedEvent,
  createYearlyReflectionQueuedEvent,
} from '@/domain/balance/constants/game-events'
import type { MicroEventChoice } from '@/domain/balance/types'
import type {
  QueuedEventChoice,
  QueuedGameEvent,
  WorkRandomEvent,
  WorkRandomEventChoice,
} from '@/domain/balance/constants/game-events.types'

function expectChoiceContract(
  category: string,
  choice: QueuedEventChoice | MicroEventChoice | WorkRandomEventChoice,
): void {
  expect(choice.id, `${category} choice id`).toBeTruthy()
  expect(choice.text, `${category} choice text`).toBeTruthy()
  expect('label' in choice, `${category} choice must not expose legacy label`).toBe(false)
}

describe('game events content contract', () => {
  it.each([
    [
      'work',
      WORK_RANDOM_EVENTS.flatMap((event: WorkRandomEvent) => event.choices),
    ],
    [
      'micro',
      Object.values(MICRO_EVENT_CHOICES_BY_ID).flatMap(
        (choices: MicroEventChoice[]) => choices,
      ),
    ],
    [
      'weekly',
      [
        ...createWeeklySummaryQueuedEvent(1).choices,
        ...WEEKLY_BONUS_MOMENT_EVENT.choices,
      ],
    ],
    [
      'monthly',
      [
        ...EVENT_FINANCE_CASH_GAP.choices,
        ...EVENT_FINANCE_RESERVE_WARNING.choices,
      ],
    ],
    [
      'yearly',
      createYearlyReflectionQueuedEvent(1).choices,
    ],
    [
      'age',
      (GLOBAL_PROGRESS_EVENTS.filter(
        (event: QueuedGameEvent) => event.type === 'age',
      ) as QueuedGameEvent[]).flatMap((event: QueuedGameEvent) => event.choices),
    ],
    [
      'financial',
      [
        ...EVENT_FINANCE_CASH_GAP.choices,
        ...EVENT_FINANCE_RESERVE_WARNING.choices,
      ],
    ],
  ])('SC-005 %s choices provide id/text and omit label', (
    category: string,
    choices: Array<QueuedEventChoice | MicroEventChoice | WorkRandomEventChoice>,
  ) => {
    expect(choices.length).toBeGreaterThan(0)

    for (const choice of choices) {
      expectChoiceContract(category, choice)
    }
  })
})
