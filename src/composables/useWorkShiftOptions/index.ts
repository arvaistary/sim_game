import type { UseWorkShiftOptions, WorkOptions, WorkSnapshot } from './useWorkShiftOptions.types'
import { useCareerStore } from '@/stores/career-store'

/**
 * Рассчитать длительность рабочей смены из параметров вакансии.
 * @description [Composable] - единое правило расчёта для панели дня и карьеры.
 * @return { number } часы стандартной смены
 */
export function resolveDailyHours(work: WorkSnapshot): number {
  if (work.salaryPerHour > 0 && work.salaryPerDay > 0) {
    return Math.max(1, Math.round(work.salaryPerDay / work.salaryPerHour))
  }

  const [workDaysRaw] = work.schedule.split('/')
  const workDays: number = Math.max(1, Number(workDaysRaw) || 1)
  const bySchedule: number = work.requiredHoursPerWeek > 0
    ? Math.round(work.requiredHoursPerWeek / workDays)
    : 8

  return Math.max(1, bySchedule)
}

/**
 * Предоставить варианты рабочих часов текущей вакансии.
 * @description [Composable] - возвращает null для безработного персонажа.
 * @return { ComputedRef<WorkOptions | null> } вычисляемые параметры смены
 */
export function useWorkShiftOptions(): UseWorkShiftOptions {
  const careerStore = useCareerStore()
  const workOptions: ComputedRef<WorkOptions | null> = computed<WorkOptions | null>(() => {
    const job: WorkSnapshot = careerStore.currentJob

    if (!job?.employed) return null

    const work: WorkSnapshot = {
      id: job.id,
      name: job.name,
      schedule: job.schedule,
      employed: job.employed,
      salaryPerHour: job.salaryPerHour,
      salaryPerDay: job.salaryPerDay,
      requiredHoursPerWeek: job.requiredHoursPerWeek,
      workedHoursCurrentWeek: job.workedHoursCurrentWeek,
    }
    const dailyHours: number = resolveDailyHours(work)
    const requiredHoursPerWeek: number = Math.max(0, work.requiredHoursPerWeek)
    const workedHoursCurrentWeek: number = Math.max(0, work.workedHoursCurrentWeek)
    const remainingHoursCurrentWeek: number = requiredHoursPerWeek > 0
      ? Math.max(0, requiredHoursPerWeek - workedHoursCurrentWeek)
      : dailyHours

    return {
      jobName: work.name,
      schedule: work.schedule,
      dailyHours,
      oneDayHours: remainingHoursCurrentWeek > 0 ? Math.min(dailyHours, remainingHoursCurrentWeek) : 0,
      fullShiftHours: remainingHoursCurrentWeek,
      requiredHoursPerWeek,
      workedHoursCurrentWeek,
      remainingHoursCurrentWeek,
    }
  })

  return { workOptions }
}

export type { UseWorkShiftOptions, WorkOptions, WorkSnapshot } from './useWorkShiftOptions.types'
