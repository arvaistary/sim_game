import { describe, expect, test } from 'vitest'
import {
  buildCleanSlateAdultStartPayload,
  buildInfancyPrologueStartPayload,
} from '@/domain/balance/utils/build-start-payloads'
import { CLEAN_SLATE_ADULT_SKILLS } from '@/domain/balance/constants/prologue/anti-imba-caps'
import { buildAdultGameSavePayload } from '@/domain/balance/utils/build-adult-game-save'

describe('start payloads', () => {
  test('adult clean slate uses baseline skills and skips prologue', () => {
    const payload = buildCleanSlateAdultStartPayload({
      playerName: 'Анна',
      startAge: 18,
    })

    expect(payload.prologueCompleted).toBe(true)
    expect(payload.prologue).toBeNull()
    expect(payload.skills).toEqual(CLEAN_SLATE_ADULT_SKILLS)
    expect((payload.education as { educationLevel: string }).educationLevel).toBe('none')
  })

  test('infancy starts incomplete prologue at age 0', () => {
    const payload = buildInfancyPrologueStartPayload({
      playerName: 'Игорь',
      seed: 99,
    })

    expect(payload.prologueCompleted).toBe(false)
    expect(payload.startAge).toBe(0)
    expect(payload.currentAge).toBe(0)
    expect(payload.skills).toEqual({})
    expect(payload.prologueSeed).toBe(99)
  })

  test('player adult start must not equal test buff builder', () => {
    const clean = buildCleanSlateAdultStartPayload({ playerName: 'X', startAge: 18 })
    const buff = buildAdultGameSavePayload({ playerName: 'X' })

    expect(clean.skills).not.toEqual(buff.skills)
    expect(clean.currentAge).not.toBe(buff.currentAge)
  })
})
