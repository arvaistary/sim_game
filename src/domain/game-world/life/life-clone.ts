import type { LifeState, LifeSummary } from './life.types'

/**
 * Скопировать состояние жизненного цикла без общих вложенных ссылок.
 * @description [Domain] - helper для aggregate и persistence snapshots.
 * @param state исходное состояние
 * @return { LifeState } независимая копия
 */
export function cloneLifeState(state: LifeState): LifeState {
  const summary: LifeSummary | null = state.summary

  return {
    status: state.status,
    lowMoodDays: state.lowMoodDays,
    deathCause: state.deathCause,
    summary: summary === null
      ? null
      : {
          ...summary,
          score: { ...summary.score, criteria: { ...summary.score.criteria } },
          finance: { ...summary.finance },
          career: { ...summary.career },
          topSkills: summary.topSkills.map(skill => ({ ...skill })),
          family: { ...summary.family },
          housing: { ...summary.housing },
          hobbies: { ...summary.hobbies },
        },
  }
}
