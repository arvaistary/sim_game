import { EDUCATION_PATHS } from '@/domain/balance/constants/education-paths'
import { INITIAL_SAVE, INITIAL_TIME_TEMPLATE } from '@/domain/balance/constants/initial-save'

export type NewGamePathId = 'none' | 'school' | 'institute'

const AGE_MIN = 0
const AGE_MAX = 65

function educationForPath(pathId: NewGamePathId) {
  switch (pathId) {
    case 'none':
      return { school: 'none', institute: 'none', educationLevel: 'Нет', activeCourses: [] as unknown[] }
    case 'school':
      return { school: 'completed', institute: 'none', educationLevel: 'Среднее', activeCourses: [] as unknown[] }
    case 'institute':
      return { school: 'completed', institute: 'completed', educationLevel: 'Высшее', activeCourses: [] as unknown[] }
    default:
      return { school: 'none', institute: 'none', educationLevel: 'Нет', activeCourses: [] as unknown[] }
  }
}

/**
 * Полный сейв для новой игры: без работы, стартовые статы из INITIAL_SAVE, образование и навыки по выбранному пути.
 */
export function buildNewGameSavePayload(input: {
  playerName: string
  startAge: number
  pathId: NewGamePathId
}): Record<string, unknown> {
  const path = EDUCATION_PATHS.find(p => p.id === input.pathId)
  if (!path) {
    throw new Error(`Unknown education path: ${input.pathId}`)
  }

  const rawAge = Number(input.startAge)
  const age = Math.max(AGE_MIN, Math.min(AGE_MAX, Number.isFinite(rawAge) ? Math.floor(rawAge) : 18))
  const base = structuredClone(INITIAL_SAVE) as unknown as Record<string, unknown>
  const skills = {
    ...(base.skills as Record<string, number>),
    ...path.result.skills,
  }

  const time = {
    ...structuredClone(INITIAL_TIME_TEMPLATE),
    startAge: age,
    currentAge: age,
  }

  const money = base.money as number
  const lifetimeStats = {
    ...(base.lifetimeStats as Record<string, unknown>),
    maxMoney: money,
  }

  return {
    ...base,
    playerName: input.playerName.trim(),
    startAge: age,
    currentAge: age,
    currentJob: null,
    skills,
    education: educationForPath(input.pathId),
    time,
    lifetimeStats,
  }
}

export const NEW_GAME_AGE_BOUNDS = { min: AGE_MIN, max: AGE_MAX } as const
