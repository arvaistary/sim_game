export interface CareerTrackItem {
  id: string
  name: string
  description: string
  level: number
  schedule: string
  unlocked: boolean
  current: boolean
  effectiveSalaryPerHour?: number
  salaryPerHour?: number
  missingProfessionalism?: number
  educationRequiredLabel?: string
}

/** Сырая запись карьерного трека, возвращаемая gameStore.getCareerTrack() */
export interface CareerTrackRawEntry {
  id: string
  name: string
  level: number
  schedule: string
  salaryPerHour: number
}
