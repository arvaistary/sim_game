import { CAREER_JOBS } from '@/domain/balance/constants/career-jobs'

export function resolveSalaryPerHour(career: Record<string, unknown> | null): number {
  if (!career) return 0

  const salaryPerHour = toFiniteNumber(career.salaryPerHour, 0)
  const salaryPerDay = toFiniteNumber(career.salaryPerDay, 0)
  const salaryPerWeek = toFiniteNumber(career.salaryPerWeek, 0)

  if (salaryPerHour > 0) return salaryPerHour
  if (salaryPerDay > 0) return Math.round(salaryPerDay / 8)
  if (salaryPerWeek > 0) return Math.round(salaryPerWeek / 40)

  if (career.id) {
    const job = CAREER_JOBS.find((item) => item.id === career.id)
    if (job?.salaryPerHour) return job.salaryPerHour
  }

  return 0
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(toFiniteNumber(value, 0))
}

export function getEducationRank(level: string): number {
  const map: Record<string, number> = {
    'Нет': -1,
    'Среднее': 0,
    'Высшее': 1,
    'Бакалавриат': 2,
    'Магистратура': 3,
    'MBA': 4,
  }
  return map[level] ?? -1
}

export function getEducationLabelByRank(rank: number): string {
  const map: Record<number, string> = {
    '-1': 'Любое',
    0: 'Среднее',
    1: 'Высшее',
    2: 'Бакалавриат',
    3: 'Магистратура',
    4: 'MBA',
  }
  return map[rank] ?? 'Любое'
}

export function toFiniteNumber(value: unknown, fallback: number): number {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : fallback
}
