import type { CareerJob } from '@domain/balance/types'
import type { ChangeCareerResult } from './index.types'

import { CAREER_JOBS } from '@domain/balance/constants/career-jobs'

/**
 * @description [Application/Game] - проверяет доступность вакансии по навыкам и возвращает результат смены карьеры
 * @return { ChangeCareerResult } результат смены карьеры
 */
export function changeCareer(jobId: string, getSkillLevel: (skill: string) => number): ChangeCareerResult {
  const job: CareerJob | undefined = CAREER_JOBS.find(
    (careerJob: CareerJob) => careerJob.id === jobId,
  )

  if (!job) {
    return { success: false, message: 'Вакансия не найдена' }
  }

  if (jobId === 'it_middle' && getSkillLevel('programming') < 5) {
    return { success: false, message: 'Требуется программирование 5+' }
  }

  if (jobId === 'it_senior' && getSkillLevel('programming') < 10) {
    return { success: false, message: 'Требуется программирование 10+' }
  }

  if (jobId === 'it_techlead' && getSkillLevel('leadership') < 8) {
    return { success: false, message: 'Требуется лидерство 8+' }
  }

  return { success: true, message: `Вы устроились на ${job.name}` }
}

/**
 * @description [Application/Game] - проверяет доступность вакансии
 * @return { boolean } доступна ли вакансия
 */
export function isJobAvailable(jobId: string, getSkillLevel: (skill: string) => number): boolean {
  return changeCareer(jobId, getSkillLevel).success
}

/**
 * @description [Application/Game] - рассчитывает зарплату за рабочую смену
 * @return { number } зарплата за указанное количество часов
 */
export function calculateWorkSalary(salaryPerHour: number, hours: number): number {
  return hours * salaryPerHour
}

/**
 * @description [Application/Game] - рассчитывает стоимость инвестиции
 * @return { number } итоговый доход по инвестиции
 */
export function calculateInvestmentReturn(amount: number, returnRate: number): number {
  return Math.floor(amount * (returnRate / 100))
}

/**
 * @description [Application/Game] - рассчитывает энергию после сна
 * @return { number } итоговый уровень энергии
 */
export function calculateSleepEnergy(currentEnergy: number, hours: number): number {
  return Math.min(100, currentEnergy + hours * 10)
}

/**
 * @description [Application/Game] - рассчитывает изменения статов после рабочей смены
 * @return { Record<string, number> } изменения статов
 */
export function calculateWorkStatChanges(hours: number): Record<string, number> {
  return {
    energy: -(hours * 3),
    hunger: +(hours * 2),
  }
}
