import type { CareerJob } from '@domain/balance/types'
import type {
  ChangeCareerResult,
  WorkShiftContext,
  WorkShiftCheckResult,
  WorkShiftExecutionResult,
  CareerTrackEntry,
} from './index.types'

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

  return {
    success: true,
    message: `Вы устроились на ${job.name}`,
    job: {
      id: job.id,
      name: job.name,
      salaryPerHour: job.salaryPerHour,
      requiredHoursPerWeek: job.requiredHoursPerWeek,
      schedule: job.schedule,
    },
  }
}

/**
 * @description [Application/Game] - рассчитывает изменения характеристик за рабочие часы
 * @return { Record<string, number> } изменения характеристик
 */
export function calculateWorkStatChanges(hours: number): Record<string, number> {
  return {
    energy: -(hours * 3),
    hunger: +(hours * 2),
  }
}

/**
 * @description [Application/Game] - проверяет возможность рабочей смены
 * @return { WorkShiftCheckResult } результат проверки
 */
export function checkWorkShift(hours: number, context: WorkShiftContext): WorkShiftCheckResult {
  if (!context.isEmployed) return { canDo: false, reason: 'Нет работы' }

  if (context.energy < hours * 3) return { canDo: false, reason: 'Недостаточно энергии' }

  if (context.weekHoursRemaining < hours) return { canDo: false, reason: 'Недостаточно часов в неделе' }

  return { canDo: true }
}

/**
 * @description [Application/Game] - выполняет рабочую смену и возвращает результат
 * @return { WorkShiftExecutionResult } результат рабочей смены
 */
export function executeWorkShift(hours: number, context: WorkShiftContext): WorkShiftExecutionResult {
  const check: WorkShiftCheckResult = checkWorkShift(hours, context)

  if (!check.canDo) {
    return {
      success: false,
      message: check.reason ?? 'Ошибка',
      salary: 0,
      statChanges: {},
      hourCost: hours,
    }
  }

  const salary: number = hours * context.salaryPerHour
  const statChanges: Record<string, number> = calculateWorkStatChanges(hours)

  return {
    success: true,
    message: `Вы заработали ${salary} ₽`,
    salary,
    statChanges,
    hourCost: hours,
  }
}

/**
 * @description [Application/Game] - возвращает текстовую метку для уровня образования
 * @return { string } метка уровня образования
 */
export function getEducationRequirementLabel(minEducationRank: number): string {
  if (minEducationRank <= -1) return 'Любое'

  if (minEducationRank === 0) return 'Среднее'

  if (minEducationRank === 1) return 'Высшее'

  if (minEducationRank === 2) return 'Бакалавриат'

  if (minEducationRank === 3) return 'Магистратура'

  if (minEducationRank === 4) return 'MBA'

  return 'Неизвестно'
}

/**
 * @description [Application/Game] - возвращает карьерный трек с информацией о доступности вакансий
 * @return { CareerTrackEntry[] } список вакансий с состоянием разблокировки
 */
export function getCareerTrack(
  currentJobId: string,
  professionalism: number,
  educationRank: number
): CareerTrackEntry[] {
  return CAREER_JOBS.map((job) => {
    const unlocked: boolean = professionalism >= job.minProfessionalism && educationRank >= job.minEducationRank

    return {
      id: job.id,
      name: job.name,
      level: job.level,
      schedule: job.schedule,
      salaryPerHour: job.salaryPerHour,
      current: job.id === currentJobId,
      unlocked,
      missingProfessionalism: Math.max(0, job.minProfessionalism - professionalism),
      educationRequiredLabel: getEducationRequirementLabel(job.minEducationRank),
    }
  })
}
