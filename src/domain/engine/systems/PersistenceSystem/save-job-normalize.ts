/**
 * Каноническая нормализация полей работы в save-объекте (без привязки к PersistenceSystem).
 */

export function resolveSalaryPerHour(job: Record<string, unknown> = {}): number {
  if (typeof job?.salaryPerHour === 'number' && (job.salaryPerHour as number) > 0) return job.salaryPerHour as number
  if (typeof job?.salaryPerDay === 'number' && (job.salaryPerDay as number) > 0) return Math.round((job.salaryPerDay as number) / 8)
  if (typeof job?.salaryPerWeek === 'number' && (job.salaryPerWeek as number) > 0) return Math.round((job.salaryPerWeek as number) / 40)
  return 0
}

export function normalizeJobShape(currentJob: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!currentJob || typeof currentJob !== 'object') return null

  const salaryPerHour = resolveSalaryPerHour(currentJob)

  return {
    id: currentJob.id ?? null,
    name: currentJob.name ?? 'Безработный',
    schedule: currentJob.schedule ?? '5/2',
    employed: currentJob.employed ?? Boolean(currentJob.id),
    level: currentJob.level ?? 1,
    salaryPerHour,
    salaryPerDay: currentJob.salaryPerDay ?? salaryPerHour * 8,
    salaryPerWeek: currentJob.salaryPerWeek ?? salaryPerHour * 40,
    requiredHoursPerWeek: Math.max(0, Number(currentJob.requiredHoursPerWeek) || 0),
    workedHoursCurrentWeek: Math.max(0, Number(currentJob.workedHoursCurrentWeek) || 0),
    pendingSalaryWeek: Math.max(0, Number(currentJob.pendingSalaryWeek) || 0),
    totalWorkedHours: Math.max(0, Number(currentJob.totalWorkedHours) || 0),
    daysAtWork: Math.max(0, Number(currentJob.daysAtWork) || 0),
  }
}
