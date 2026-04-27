import type { EducationRank } from '@domain/balance/types'

export const EDUCATION_LEVEL_TO_RANK: Record<string, EducationRank> = {
  'Нет': -1,
  'Среднее': 0,
  'Высшее': 1,
  MBA: 2,
}

export const EDUCATION_RANK_TO_LABEL: Record<number, string> = {
  [-1]: 'Нет',
  0: 'Среднее',
  1: 'Высшее',
  2: 'MBA',
}

export function getEducationRank(level: string): EducationRank {
  return EDUCATION_LEVEL_TO_RANK[level] ?? -1
}

export function getEducationLabelByRank(rank: number): string {
  return EDUCATION_RANK_TO_LABEL[rank] ?? 'Нет'
}

