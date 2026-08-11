import { describe, expect, test } from 'vitest'
import {
  CLEAN_SLATE_ADULT_SKILLS,
  EXAM_MULTIPLIER_MAX,
  EXAM_MULTIPLIER_MIN,
  PROLOGUE_ANTI_IMBA_CAPS,
} from '@/domain/balance/constants/prologue/anti-imba-caps'
import { createEmptyTagPoints } from '@/domain/balance/constants/prologue/tag-catalog'
import {
  applyPrologueChoice,
  computeExamMultiplier,
  computeFinalMultiplier,
  convertTagsToSkills,
} from '@/domain/prologue/prologue-budget'
import type { PrologueTagPoints } from '@/domain/prologue/prologue.types'

describe('prologue exam multipliers', () => {
  test('0 correct → 0.7; all correct → 1.15', () => {
    expect(computeExamMultiplier({ correct: 0, questionCount: 5 })).toBeCloseTo(EXAM_MULTIPLIER_MIN)
    expect(computeExamMultiplier({ correct: 5, questionCount: 5 })).toBeCloseTo(EXAM_MULTIPLIER_MAX)
  })

  test('m_final averages school and postsec then clamps', () => {
    const low: number = computeExamMultiplier({ correct: 0, questionCount: 5 })
    const high: number = computeExamMultiplier({ correct: 5, questionCount: 5 })
    const mid: number = computeFinalMultiplier({ mSchool: low, mPostsec: high })

    expect(mid).toBeCloseTo(0.5 * low + 0.5 * high)
    expect(mid).toBeGreaterThanOrEqual(EXAM_MULTIPLIER_MIN)
    expect(mid).toBeLessThanOrEqual(EXAM_MULTIPLIER_MAX)
  })
})

describe('prologue budget applyChoice', () => {
  test('clamps positive deltas to remaining stage budget', () => {
    const tags: PrologueTagPoints = createEmptyTagPoints()
    const result = applyPrologueChoice({
      tagPoints: tags,
      stageSpent: 3,
      stageBudget: 4,
      deltas: { stem: 2, social: 2 },
      traits: [],
      memories: [],
      maxTraits: PROLOGUE_ANTI_IMBA_CAPS.maxTraitsGranted,
    })

    expect(result.stageSpent).toBeLessThanOrEqual(4)
    expect(result.stageSpent - 3).toBeGreaterThanOrEqual(1)
    expect(result.stageSpent - 3).toBeLessThanOrEqual(1)
  })
})

describe('prologue convertTagsToSkills', () => {
  test('never exceeds anti-imba caps', () => {
    const tags: PrologueTagPoints = {
      ...createEmptyTagPoints(),
      stem: 8,
      lingua: 6,
      social: 6,
      discipline: 6,
      body: 4,
      creative: 4,
      practical: 6,
      curiosity: 4,
    }
    const mFinal: number = EXAM_MULTIPLIER_MAX
    const result = convertTagsToSkills({
      tags,
      mFinal,
      track: 'uni',
      candidateTraits: ['curious', 'disciplined', 'friendly', 'creative'],
      memories: ['m1'],
    })

    const levels: number[] = Object.values(result.skills)
    const sum: number = levels.reduce((acc: number, level: number) => acc + level, 0)
    const distinct: number = levels.filter((level: number) => level > 0).length

    expect(sum).toBeLessThanOrEqual(PROLOGUE_ANTI_IMBA_CAPS.maxSumOfAdultSkillLevels)
    expect(distinct).toBeLessThanOrEqual(PROLOGUE_ANTI_IMBA_CAPS.maxDistinctAdultSkillsWithLevel)
    expect(Math.max(0, ...levels)).toBeLessThanOrEqual(PROLOGUE_ANTI_IMBA_CAPS.maxSingleAdultSkillLevel)
    expect(result.traits.length).toBeLessThanOrEqual(PROLOGUE_ANTI_IMBA_CAPS.maxTraitsGranted)
  })

  test('worst run floors to clean slate', () => {
    const result = convertTagsToSkills({
      tags: createEmptyTagPoints(),
      mFinal: EXAM_MULTIPLIER_MIN,
      track: 'tech',
      candidateTraits: [],
      memories: [],
    })

    for (const skillKey of Object.keys(CLEAN_SLATE_ADULT_SKILLS)) {
      expect(result.skills[skillKey] ?? 0).toBeGreaterThanOrEqual(CLEAN_SLATE_ADULT_SKILLS[skillKey] ?? 0)
    }
  })

  test('tech vs uni bias changes shape not total power budget', () => {
    const tags: PrologueTagPoints = {
      ...createEmptyTagPoints(),
      stem: 2,
      practical: 2,
      discipline: 2,
      social: 2,
      curiosity: 1,
    }
    const mFinal: number = 1.0
    const tech = convertTagsToSkills({
      tags,
      mFinal,
      track: 'tech',
      candidateTraits: [],
      memories: [],
    })
    const uni = convertTagsToSkills({
      tags,
      mFinal,
      track: 'uni',
      candidateTraits: [],
      memories: [],
    })

    const techSum: number = Object.values(tech.skills).reduce((a: number, b: number) => a + b, 0)
    const uniSum: number = Object.values(uni.skills).reduce((a: number, b: number) => a + b, 0)

    expect(techSum).toBeLessThanOrEqual(PROLOGUE_ANTI_IMBA_CAPS.maxSumOfAdultSkillLevels)
    expect(uniSum).toBeLessThanOrEqual(PROLOGUE_ANTI_IMBA_CAPS.maxSumOfAdultSkillLevels)
    expect(tech.skills.financialLiteracy ?? 0).toBeGreaterThanOrEqual(uni.skills.financialLiteracy ?? 0)
    expect(uni.skills.leadership ?? 0).toBeGreaterThanOrEqual(tech.skills.leadership ?? 0)
    expect(
      (tech.skills.financialLiteracy ?? 0) !== (uni.skills.financialLiteracy ?? 0)
      || (tech.skills.leadership ?? 0) !== (uni.skills.leadership ?? 0)
      || (tech.skills.professionalism ?? 0) !== (uni.skills.professionalism ?? 0),
    ).toBe(true)
  })
})
