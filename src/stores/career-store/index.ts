
import type { JobSnapshot } from './index.types'
import { UNEMPLOYED } from './index.constants'

export const useCareerStore = defineStore('career', () => {
  const currentJob = ref<JobSnapshot>({ ...UNEMPLOYED })
  const jobHistory = ref<JobSnapshot[]>([])
  const careerLevel = ref<number>(0)
  const promotions = ref<number>(0)

  const isEmployed = computed<boolean>(() => currentJob.value.employed)
  const canWork = computed<boolean>(() => currentJob.value.employed)
  const hasJob = computed<boolean>(() => currentJob.value.id !== '')

  const totalWorkedHours = computed<number>(() => currentJob.value.totalWorkedHours)
  const pendingSalary = computed<number>(() => currentJob.value.pendingSalaryWeek)

  const weeklyHoursRemaining = computed<number>(() => {

    if (!currentJob.value.employed) return 0

    return Math.max(0, currentJob.value.requiredHoursPerWeek - currentJob.value.workedHoursCurrentWeek)
  })

  function setJob(job: Partial<JobSnapshot>): void {
    currentJob.value = { ...currentJob.value, ...job }
  }

  function startWork(jobData: Partial<JobSnapshot>): void {
    currentJob.value = {
      ...currentJob.value,
      ...jobData,
      employed: true,
      workedHoursCurrentWeek: 0,
      pendingSalaryWeek: 0,
    }

    if (jobData.id) {
      jobHistory.value.push({ ...currentJob.value })
    }
  }

  function endWork(): void {
    currentJob.value = { ...UNEMPLOYED }
  }

  function addWorkHours(hours: number): void {
    if (!currentJob.value.employed) return

    currentJob.value.workedHoursCurrentWeek += hours
    currentJob.value.totalWorkedHours += hours
    currentJob.value.daysAtWork += 1
  }

  function addPendingSalary(amount: number): void {
    if (!currentJob.value.employed) return

    currentJob.value.pendingSalaryWeek += amount
  }

  function collectSalary(): number {
    const salary: number = currentJob.value.pendingSalaryWeek
    currentJob.value.pendingSalaryWeek = 0

    return salary
  }

  function resetWeek(): void {
    currentJob.value.workedHoursCurrentWeek = 0
  }

  function promote(newJob?: Partial<JobSnapshot>): void {
    careerLevel.value += 1
    promotions.value += 1

    if (newJob) {
      currentJob.value = { ...currentJob.value, ...newJob }
    }
  }

  function reset(): void {
    currentJob.value = { ...UNEMPLOYED }
    jobHistory.value = []
    careerLevel.value = 0
    promotions.value = 0
  }

  function save(): Record<string, unknown> {
    return {
      currentJob: currentJob.value,
      jobHistory: jobHistory.value,
      careerLevel: careerLevel.value,
      promotions: promotions.value,
    }
  }

  function load(data: Record<string, unknown>): void {
    if (data?.currentJob) currentJob.value = data.currentJob as JobSnapshot

    if (data?.jobHistory) jobHistory.value = data.jobHistory as JobSnapshot[]

    if (data?.careerLevel) careerLevel.value = data.careerLevel as number

    if (data?.promotions) promotions.value = data.promotions as number
  }

  return {
    currentJob,
    jobHistory,
    careerLevel,
    promotions,
    isEmployed,
    canWork,
    hasJob,
    totalWorkedHours,
    pendingSalary,
    weeklyHoursRemaining,
    setJob,
    startWork,
    endWork,
    addWorkHours,
    addPendingSalary,
    collectSalary,
    resetWeek,
    promote,
    reset,
    save,
    load,
  }
})

export { UNEMPLOYED } from './index.constants'
export type * from './index.types'
