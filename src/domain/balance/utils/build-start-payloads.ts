import { CLEAN_SLATE_ADULT_SKILLS, CLEAN_SLATE_EDUCATION_LEVEL } from '@/domain/balance/constants/prologue/anti-imba-caps'
import { INITIAL_SAVE, INITIAL_TIME_TEMPLATE } from '@/domain/balance/constants/initial-save'

export interface CleanSlateAdultStartInput {
  playerName: string
  startAge: number
}

export interface InfancyPrologueStartInput {
  playerName: string
  seed?: number
}

/**
 * @description [Start] - Adult start: clean slate skills + education Нет (не test buff).
 * @return { Record<string, unknown> } payload для stores
 */
export function buildCleanSlateAdultStartPayload(data: CleanSlateAdultStartInput): Record<string, unknown> {
  const age: number = Math.max(16, Math.min(20, Math.floor(data.startAge)))
  const base = structuredClone(INITIAL_SAVE) as unknown as Record<string, unknown>

  return {
    ...base,
    playerName: data.playerName.trim(),
    startAge: age,
    currentAge: age,
    skills: { ...CLEAN_SLATE_ADULT_SKILLS },
    education: {
      school: 'none',
      institute: 'none',
      educationLevel: 'none',
      activeCourses: [],
      completedPrograms: [],
    },
    educationLevelLabel: CLEAN_SLATE_EDUCATION_LEVEL,
    time: {
      ...structuredClone(INITIAL_TIME_TEMPLATE),
      startAge: age,
      currentAge: age,
    },
    prologueCompleted: true,
    prologue: null,
  }
}

/**
 * @description [Start] - Infancy start: флаги пролога, age 0, без dashboard-навыков.
 * @return { Record<string, unknown> } payload
 */
export function buildInfancyPrologueStartPayload(data: InfancyPrologueStartInput): Record<string, unknown> {
  const base = structuredClone(INITIAL_SAVE) as unknown as Record<string, unknown>

  return {
    ...base,
    playerName: data.playerName.trim(),
    startAge: 0,
    currentAge: 0,
    skills: {},
    education: {
      school: 'none',
      institute: 'none',
      educationLevel: 'none',
      activeCourses: [],
      completedPrograms: [],
    },
    time: {
      ...structuredClone(INITIAL_TIME_TEMPLATE),
      startAge: 0,
      currentAge: 0,
    },
    money: INITIAL_SAVE.money,
    prologueCompleted: false,
    prologue: null,
    prologueSeed: data.seed ?? (Date.now() >>> 0),
  }
}
