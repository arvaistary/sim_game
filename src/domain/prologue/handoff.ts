import { PROLOGUE_HANDOFF_AGE } from '@/domain/balance/constants/prologue/anti-imba-caps'
import { INITIAL_SAVE } from '@/domain/balance/constants/initial-save'
import { computeFinalMultiplier, convertTagsToSkills } from './prologue-budget'
import type {
  PrologueHandoffPatch,
  PrologueSkillConversionResult,
  PrologueState,
  PrologueTrack,
} from './prologue.types'

/**
 * @description [Prologue] - Строит handoff-патч во взрослый сейв (age 18, Model A conversion).
 * @return { PrologueHandoffPatch } патч
 */
export function buildPrologueHandoffPatch(state: PrologueState): PrologueHandoffPatch {
  if (!state.track) {
    throw new Error('Prologue handoff requires selected track')
  }

  if (state.mSchool === null || state.mPostsec === null) {
    throw new Error('Prologue handoff requires both exam multipliers')
  }

  const track: PrologueTrack = state.track
  const mFinal: number = computeFinalMultiplier({
    mSchool: state.mSchool,
    mPostsec: state.mPostsec,
  })

  const conversion: PrologueSkillConversionResult = convertTagsToSkills({
    tags: state.tagPoints,
    mFinal,
    track,
    candidateTraits: state.traits,
    memories: state.memories,
  })

  const educationLevel: PrologueHandoffPatch['educationLevel'] =
    track === 'tech' ? 'Среднее профессиональное' : 'Высшее'

  return {
    startAge: PROLOGUE_HANDOFF_AGE,
    currentAge: PROLOGUE_HANDOFF_AGE,
    skills: conversion.skills,
    educationLevel,
    /** Store EducationLevel: college / bachelor — labels mapped in RANK_LABELS. */
    educationLevelKey: track === 'tech' ? 'college' : 'bachelor',
    school: 'completed',
    institute: track === 'uni' ? 'completed' : 'none',
    traits: conversion.traits,
    memories: conversion.memories,
    money: INITIAL_SAVE.money,
    prologueCompleted: true,
    fantasyLabel: conversion.fantasyLabel,
    mFinal,
  }
}
