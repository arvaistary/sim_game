import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CareerComponent {
  id: string | null
  name: string
  schedule: string
  employed: boolean
  level: number
  salaryPerHour: number
  salaryPerDay: number
  salaryPerWeek: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
  pendingSalaryWeek: number
  totalWorkedHours: number
  daysAtWork: number
}

export interface JobSnapshot {
  id: string
  name: string
  schedule: string
  employed: boolean
  level: number
  salaryPerHour: number
  salaryPerDay: number
  salaryPerWeek: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
  pendingSalaryWeek: number
  totalWorkedHours: number
  daysAtWork: number
}

const UNEMPLOYED: JobSnapshot = {
  id: '',
  name: 'Безработный',
  schedule: '—',
  employed: false,
  level: 0,
  salaryPerHour: 0,
  salaryPerDay: 0,
  salaryPerWeek: 0,
  requiredHoursPerWeek: 0,
  workedHoursCurrentWeek: 0,
  pendingSalaryWeek: 0,
  totalWorkedHours: 0,
  daysAtWork: 0,
}

export const useCareerStore = defineStore('career', () => {
  const currentJob = ref<JobSnapshot>({ ...UNEMPLOYED })
  const jobHistory = ref<JobSnapshot[]>([])
  const careerLevel = ref(0)
  const promotions = ref(0)

  const isEmployed = computed(() => currentJob.value.employed)
  const canWork = computed(() => currentJob.value.employed)
  const hasJob = computed(() => currentJob.value.id !== '')

  const totalWorkedHours = computed(() => currentJob.value.totalWorkedHours)
  const pendingSalary = computed(() => currentJob.value.pendingSalaryWeek)

  const weeklyHoursRemaining = computed(() => {
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
    const salary = currentJob.value.pendingSalaryWeek
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