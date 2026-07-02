import type { EducationRank } from '@/domain/balance/types'

export const EDUCATION_LEVEL_TO_RANK: Record<string, EducationRank> = {
  'Нет': -1,
  'Среднее': 0,
  'Высшее': 1,
  'Бакалавриат': 2,
  'Магистратура': 3,
  MBA: 4,
}

export const EDUCATION_RANK_TO_LABEL: Record<number, string> = {
  [-1]: 'Нет',
  0: 'Среднее',
  1: 'Высшее',
  2: 'Бакалавриат',
  3: 'Магистратура',
  4: 'MBA',
}

/**
 * Маппинг store EducationLevel -> career-jobs EducationRank.
 * Store шкала: none=0, school=1, college=2, bachelor=3, master=4, phd=5.
 * Career шкала: -1=Любое, 0=Среднее, 1=Высшее, 2=Бакалавриат, 3=Магистратура, 4=MBA.
 * Семантическое соответствие: school→Среднее(0), bachelor→Высшее(1) или Бакалавриат(2),
 * master→Магистратура(3), phd→MBA(4). none→-1.
 */
export const STORE_LEVEL_TO_CAREER_RANK: Record<string, EducationRank> = {
  none: -1,
  school: 0,
  college: 1,
  bachelor: 2,
  master: 3,
  phd: 4,
}

export function getEducationRank(level: string): EducationRank {
  return EDUCATION_LEVEL_TO_RANK[level] ?? -1
}

export function getEducationLabelByRank(rank: number): string {
  return EDUCATION_RANK_TO_LABEL[rank] ?? 'Нет'
}

/**
 * Преобразует store-уровень образования в career-jobs ранг.
 * @param storeLevel - EducationLevel из education-store ('none' | 'school' | ...)
 * @returns EducationRank по шкале career-jobs
 */
export function storeLevelToCareerRank(storeLevel: string): EducationRank {
  return STORE_LEVEL_TO_CAREER_RANK[storeLevel] ?? -1
}

