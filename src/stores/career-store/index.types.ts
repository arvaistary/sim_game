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

export interface CareerStore {
  currentJob: JobSnapshot
  jobHistory: JobSnapshot[]
  careerLevel: number
  promotions: number
  isEmployed: boolean
  canWork: boolean
  hasJob: boolean
  totalWorkedHours: number
  pendingSalary: number
  weeklyHoursRemaining: number
  setJob: (job: Partial<JobSnapshot>) => void
  startWork: (jobData: Partial<JobSnapshot>) => void
  endWork: () => void
  addWorkHours: (hours: number) => void
  addPendingSalary: (amount: number) => void
  collectSalary: () => number
  resetWeek: () => void
  promote: (newJob?: Partial<JobSnapshot>) => void
  reset: () => void
  save: () => Record<string, unknown>
  load: (data: Record<string, unknown>) => void
}