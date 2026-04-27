import type { EducationLevel } from './index.types'

export const EDUCATION_RANK: Record<EducationLevel, number> = {
  none: 0,
  school: 1,
  college: 2,
  bachelor: 3,
  master: 4,
  phd: 5,
}

export const RANK_LABELS: Record<EducationLevel, string> = {
  none: 'Нет',
  school: 'Школа',
  college: 'Колледж',
  bachelor: 'Бакалавриат',
  master: 'Магистратура',
  phd: 'Аспирантура',
}

export const EDUCATION_LONG_STEP_MAX_ENERGY_DRAIN = 15
export const ENERGY_EXHAUSTION_THRESHOLD_STUDY = 20
export const EDUCATION_LONG_PROGRAM_STEP_HOURS = 4
export const COGNITIVE_LOAD_CONSTANTS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
  MAX_STUDY_HOURS_CYCLE: 8,
} as const
