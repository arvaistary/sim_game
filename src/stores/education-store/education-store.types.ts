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

export interface MilestoneReward {
  message?: string
  statChanges?: Record<string, number>
  skillChanges?: Record<string, number>
}

export interface ActiveCourseStep {
  id?: string
  title: string
  progressPercent?: number
  hoursRequired?: number
  milestoneReward?: MilestoneReward
}

export interface ActiveCourse {
  id: string
  name: string
  type?: string
  progress: number
  hoursTotal: number
  hoursRemaining: number
  currentStepIndex?: number
  steps?: ActiveCourseStep[]
}

export interface ActiveEducation {
  id: string
  name: string
  type?: string
  progress: number
  hoursTotal: number
  hoursRemaining: number
  currentStepIndex?: number
  steps?: ActiveCourseStep[]
}

export interface NeedsState {
  energy: number
  hunger: number
  stress: number
}

export interface CognitiveLoadStatus {
  label: string
  description: string
  tone: string
}

export interface CanAddStudyHoursResult {
  canDo: boolean
  reason?: string
}

export interface CognitiveLoadComponent {
  cognitiveLoad: number
  studyHoursSinceLastSleep: number
}
