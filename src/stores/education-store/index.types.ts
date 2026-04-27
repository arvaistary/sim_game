export type EducationLevel = 'none' | 'school' | 'college' | 'bachelor' | 'master' | 'phd'

export interface CompletedProgram {
  id: string
  name: string
  typeLabel?: string
  completedAtGameDay?: number
}

export interface CompletedProgramRecord {
  id: string
  name: string
  typeLabel?: string
  completedAt: number
  completedAtGameDay?: number
}

export interface ActiveEducation {
  id: string
  name: string
  progress: number
  hoursTotal: number
  hoursRemaining: number
}

export interface EducationStore {
  school: string
  institute: string
  educationLevel: EducationLevel
  activeEducation: ActiveEducation | null
  completedPrograms: CompletedProgram[]
  cognitiveLoad: number
  studyHoursSinceLastSleep: number
  educationRank: number
  educationLabel: string
  isStudying: boolean
  hasEducation: boolean
  completedCount: number
  canStartProgram: (programLevel: EducationLevel) => boolean
  canStartProgramById: (programId: string) => boolean
  setSchool: (name: string) => void
  setInstitute: (name: string) => void
  setEducationLevel: (level: EducationLevel) => void
  startProgram: (program: ActiveEducation) => void
  startProgramById: (programId: string, name: string, hours: number) => void
  updateProgress: (hoursSpent: number) => void
  completeProgram: (program: CompletedProgram) => void
  cancelProgram: () => void
  getProgramBonus: () => number
  advance: (hours?: number) => string | null
  reset: () => void
  save: () => Record<string, unknown>
  load: (data: Record<string, unknown>) => void
}

export interface ProgramStepMilestoneReward {
  statChanges?: Record<string, number>
  skillChanges?: Record<string, number>
  message?: string
}

export interface ProgramStep {
  id: string
  title: string
  hoursRequired: number
  progressPercent: number
  milestoneReward?: ProgramStepMilestoneReward
}

export interface ActiveCourse {
  id: string
  name: string
  type?: string
  progress: number
  hoursTotal: number
  hoursRemaining: number
  steps?: ProgramStep[]
  currentStepIndex?: number
}

export interface CanAddStudyHoursResult {
  canDo: boolean
  reason?: string
}

export interface CognitiveLoadComponent {
  cognitiveLoad: number
  studyHoursSinceLastSleep: number
}

export interface NeedsState {
  energy: number
  hunger: number
  stress: number
}

export type CognitiveLoadStatus = 'low' | 'medium' | 'high'
