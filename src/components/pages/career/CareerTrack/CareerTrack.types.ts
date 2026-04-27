export interface CareerTrackJob {
  id: string
  name: string
  description?: string
  level: number
  schedule: string
  salaryPerHour: number
  effectiveSalaryPerHour?: number
  current: boolean
  unlocked: boolean
  missingProfessionalism: number
  educationRequiredLabel: string
}