import type { ProloguePaceProfile, ProloguePaceProfileId } from './prologue.types'

/** MVP default: compact (~12–18 min). */
export const PROLOGUE_PACE_PROFILES: Record<ProloguePaceProfileId, ProloguePaceProfile> = {
  compact: {
    id: 'compact',
    earlyVignettes: 3,
    schoolTerms: 4,
    postSecondaryTerms: 3,
    examQuestionCount: 5,
    microbeatChance: 0.5,
    allowMinigames: true,
  },
  standard: {
    id: 'standard',
    earlyVignettes: 5,
    schoolTerms: 6,
    postSecondaryTerms: 4,
    examQuestionCount: 6,
    microbeatChance: 0.5,
    allowMinigames: true,
  },
  extended: {
    id: 'extended',
    earlyVignettes: 8,
    schoolTerms: 8,
    postSecondaryTerms: 5,
    examQuestionCount: 7,
    microbeatChance: 0.55,
    allowMinigames: true,
  },
}

export const DEFAULT_PROLOGUE_PACE_ID: ProloguePaceProfileId = 'compact'

/**
 * @description [Prologue] - Возвращает профиль длительности по id.
 * @return { ProloguePaceProfile } профиль
 */
export function getProloguePaceProfile(id: ProloguePaceProfileId): ProloguePaceProfile {
  return PROLOGUE_PACE_PROFILES[id]
}
