import type { PrologueTagId, PrologueTrack } from '@/domain/prologue/prologue.types'

/** Вес тега → взрослый навык (только реальные ключи skills-constants). */
export type TagToAdultSkillWeights = Partial<Record<string, number>>

export const TAG_TO_ADULT_SKILLS: Record<PrologueTagId, TagToAdultSkillWeights> = {
  stem: { professionalism: 1.2, timeManagement: 0.3 },
  lingua: { communication: 1.2 },
  social: { communication: 1.0, leadership: 0.4 },
  discipline: { timeManagement: 1.3, professionalism: 0.3 },
  body: { healthyLifestyle: 1.4 },
  creative: { communication: 0.4, stressResistance: 0.5 },
  practical: { financialLiteracy: 0.8, professionalism: 0.7 },
  curiosity: { professionalism: 0.3, timeManagement: 0.3, communication: 0.2 },
}

/** Лёгкий bias трека внутри того же sum-cap (не добавляет power). */
export const TRACK_SKILL_BIAS: Record<PrologueTrack, TagToAdultSkillWeights> = {
  tech: { financialLiteracy: 2.2, professionalism: 1.2, timeManagement: 1.0, healthyLifestyle: 0.8 },
  uni: { professionalism: 2.0, leadership: 2.2, communication: 1.2, stressResistance: 0.6 },
}
