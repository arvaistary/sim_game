import {
  CLEAN_SLATE_ADULT_SKILLS,
  EXAM_MULTIPLIER_MAX,
  EXAM_MULTIPLIER_MIN,
  EXAM_MULTIPLIER_SPAN,
  PROLOGUE_ANTI_IMBA_CAPS,
  PROLOGUE_STAGE_TAG_BUDGETS,
} from '@/domain/balance/constants/prologue/anti-imba-caps'
import { PROLOGUE_TAG_IDS, PROLOGUE_TAG_LABELS } from '@/domain/balance/constants/prologue/tag-catalog'
import { isPrologueTraitAllowed } from '@/domain/balance/constants/prologue/prologue-traits'
import {
  TAG_TO_ADULT_SKILLS,
  TRACK_SKILL_BIAS,
} from '@/domain/balance/constants/prologue/tag-to-adult-skills'
import type { TagToAdultSkillWeights } from '@/domain/balance/constants/prologue/tag-to-adult-skills'
import type {
  ApplyPrologueChoiceInput,
  ApplyPrologueChoiceResult,
  ComputeExamMultiplierInput,
  ComputeFinalMultiplierInput,
  ConvertTagsToSkillsInput,
  PrologueBudgetStage,
  PrologueSkillConversionResult,
  PrologueTagDeltas,
  PrologueTagId,
  PrologueTagPoints,
  PrologueTrack,
} from './prologue.types'

/**
 * @description [Prologue] - m_stage из доли правильных ответов: 0→0.7, all→1.15.
 * @return { number } множитель стадии
 */
export function computeExamMultiplier(data: ComputeExamMultiplierInput): number {
  const questionCount: number = Math.max(1, data.questionCount)
  const correct: number = Math.max(0, Math.min(data.correct, questionCount))
  const ratio: number = correct / questionCount
  const raw: number = EXAM_MULTIPLIER_MIN + ratio * EXAM_MULTIPLIER_SPAN

  return clampNumber(raw, EXAM_MULTIPLIER_MIN, EXAM_MULTIPLIER_MAX)
}

/**
 * @description [Prologue] - Итоговый m_final = среднее m_school и m_postsec в [0.7, 1.15].
 * @return { number } финальный множитель конверсии
 */
export function computeFinalMultiplier(data: ComputeFinalMultiplierInput): number {
  const averaged: number = 0.5 * data.mSchool + 0.5 * data.mPostsec

  return clampNumber(averaged, EXAM_MULTIPLIER_MIN, EXAM_MULTIPLIER_MAX)
}

/**
 * @description [Prologue] - Soft-cap бюджета стадии.
 * @return { number } бюджет
 */
export function getStageTagBudget(stage: PrologueBudgetStage): number {
  return PROLOGUE_STAGE_TAG_BUDGETS[stage]
}

/**
 * @description [Prologue] - Применяет дельты выбора внутри remaining budget; игнорирует childhood skillChanges.
 * @return { ApplyPrologueChoiceResult } обновлённые теги/traits/memories
 */
export function applyPrologueChoice(data: ApplyPrologueChoiceInput): ApplyPrologueChoiceResult {
  const remaining: number = Math.max(0, data.stageBudget - data.stageSpent)
  const scaled: PrologueTagDeltas = scaleDeltasToBudget(data.deltas, remaining)
  const nextTags: PrologueTagPoints = { ...data.tagPoints }
  let spentGain: number = 0

  for (const tagId of PROLOGUE_TAG_IDS) {
    const delta: number | undefined = scaled[tagId]

    if (delta === undefined || delta === 0) continue

    const nextValue: number = Math.max(0, nextTags[tagId] + delta)

    if (delta > 0) {
      spentGain += delta
    }

    nextTags[tagId] = nextValue
  }

  const nextTraits: string[] = [...data.traits]

  if (
    data.optionalTraitId
    && isPrologueTraitAllowed(data.optionalTraitId)
    && !nextTraits.includes(data.optionalTraitId)
    && nextTraits.length < data.maxTraits
  ) {
    nextTraits.push(data.optionalTraitId)
  }

  const nextMemories: string[] = [...data.memories]

  if (data.memoryId && !nextMemories.includes(data.memoryId)) {
    nextMemories.push(data.memoryId)
  }

  return {
    tagPoints: nextTags,
    stageSpent: data.stageSpent + spentGain,
    traits: nextTraits,
    memories: nextMemories,
  }
}

/**
 * @description [Prologue] - Конвертирует теги в уровни взрослых навыков под anti-imba caps + clean-slate floor.
 * @return { PrologueSkillConversionResult } навыки, traits, mFinal, fantasy label
 */
export function convertTagsToSkills(data: ConvertTagsToSkillsInput): PrologueSkillConversionResult {
  const rawScores: Record<string, number> = buildRawSkillScores(data.tags, data.track)
  const positiveSkillKeys: string[] = Object.keys(rawScores).filter(
    (skillKey: string) => (rawScores[skillKey] ?? 0) > 0,
  )
  const ranked: string[] = [...positiveSkillKeys].sort((left: string, right: string) => {
    const scoreDiff: number = (rawScores[right] ?? 0) - (rawScores[left] ?? 0)

    if (scoreDiff !== 0) return scoreDiff

    return left.localeCompare(right)
  })

  // Floor first so worst ≥ clean slate, then spend remaining sum under hard caps.
  const skills: Record<string, number> = { ...CLEAN_SLATE_ADULT_SKILLS }
  let sumLevels: number = Object.values(skills).reduce((acc: number, level: number) => acc + level, 0)
  let distinct: number = Object.keys(skills).filter((key: string) => (skills[key] ?? 0) > 0).length

  // Greedy +1 passes so track bias can reshape without dumping all room into top skill.
  while (sumLevels < PROLOGUE_ANTI_IMBA_CAPS.maxSumOfAdultSkillLevels) {
    let bestKey: string | null = null
    let bestScore: number = -Infinity

    for (const skillKey of ranked) {
      const current: number = skills[skillKey] ?? 0

      if (current >= PROLOGUE_ANTI_IMBA_CAPS.maxSingleAdultSkillLevel) continue

      const isNew: boolean = current <= 0

      if (isNew && distinct >= PROLOGUE_ANTI_IMBA_CAPS.maxDistinctAdultSkillsWithLevel) continue

      const score: number = (rawScores[skillKey] ?? 0) * data.mFinal
      const marginal: number = score / (current + 1)

      if (marginal > bestScore) {
        bestScore = marginal
        bestKey = skillKey
      }
    }

    if (bestKey === null || bestScore <= 0) break

    const previous: number = skills[bestKey] ?? 0
    skills[bestKey] = previous + 1
    sumLevels += 1

    if (previous <= 0) distinct += 1
  }

  const traits: string[] = data.candidateTraits
    .filter((traitId: string) => isPrologueTraitAllowed(traitId))
    .filter((traitId: string, index: number, list: string[]) => list.indexOf(traitId) === index)
    .slice(0, PROLOGUE_ANTI_IMBA_CAPS.maxTraitsGranted)

  return {
    skills,
    traits,
    memories: [...data.memories],
    mFinal: data.mFinal,
    fantasyLabel: buildFantasyLabel(data.tags, data.track),
  }
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function scaleDeltasToBudget(deltas: PrologueTagDeltas, remaining: number): PrologueTagDeltas {
  if (remaining <= 0) return {}

  let positiveSum: number = 0

  for (const tagId of PROLOGUE_TAG_IDS) {
    const delta: number | undefined = deltas[tagId]

    if (delta !== undefined && delta > 0) positiveSum += delta
  }

  if (positiveSum <= 0) return {}

  if (positiveSum <= remaining) return { ...deltas }

  const scale: number = remaining / positiveSum
  const scaled: PrologueTagDeltas = {}
  let spent: number = 0

  for (const tagId of PROLOGUE_TAG_IDS) {
    const delta: number | undefined = deltas[tagId]

    if (delta === undefined) continue

    if (delta > 0) {
      const next: number = Math.floor(delta * scale)

      if (next > 0) {
        scaled[tagId] = next
        spent += next
      }
    } else {
      scaled[tagId] = delta
    }
  }

  // floor() can wipe all positives while remaining > 0 — keep at least 1 on top tag

  if (spent === 0 && remaining > 0) {
    let bestTag: PrologueTagId | null = null
    let bestDelta: number = -Infinity

    for (const tagId of PROLOGUE_TAG_IDS) {
      const delta: number | undefined = deltas[tagId]

      if (delta === undefined || delta <= 0) continue

      if (delta > bestDelta) {
        bestDelta = delta
        bestTag = tagId
      }
    }

    if (bestTag) scaled[bestTag] = 1
  }

  return scaled
}

function buildRawSkillScores(tags: PrologueTagPoints, track: PrologueTrack): Record<string, number> {
  const scores: Record<string, number> = {}

  for (const tagId of PROLOGUE_TAG_IDS) {
    const points: number = tags[tagId]

    if (points <= 0) continue

    const weights: TagToAdultSkillWeights = TAG_TO_ADULT_SKILLS[tagId]

    for (const skillKey of Object.keys(weights)) {
      const weight: number = weights[skillKey] ?? 0
      scores[skillKey] = (scores[skillKey] ?? 0) + points * weight
    }
  }

  const bias: TagToAdultSkillWeights = TRACK_SKILL_BIAS[track]

  for (const skillKey of Object.keys(bias)) {
    const weight: number = bias[skillKey] ?? 0
    scores[skillKey] = (scores[skillKey] ?? 0) + weight
  }

  return scores
}

function buildFantasyLabel(tags: PrologueTagPoints, track: PrologueTrack): string {
  const topTags: PrologueTagId[] = [...PROLOGUE_TAG_IDS]
    .sort((left: PrologueTagId, right: PrologueTagId) => tags[right] - tags[left] || left.localeCompare(right))
    .slice(0, 2)

  const trackLabel: string = track === 'tech' ? 'Практик' : 'Гуманитарий'

  if (topTags.length === 0) return trackLabel

  const first: PrologueTagId = topTags[0]!
  const firstLabel: string = PROLOGUE_TAG_LABELS[first]
  const second: PrologueTagId | undefined = topTags[1]

  if (!second || tags[second] <= 0) {
    return `${trackLabel} · ${firstLabel}`
  }

  return `${trackLabel} · ${firstLabel} / ${PROLOGUE_TAG_LABELS[second]}`
}
