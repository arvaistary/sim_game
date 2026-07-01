export interface StudyModalProps {
  isOpen: boolean
  courseName: string
  courseDescription: string
  currentStep: number
  totalSteps: number
  hoursRemaining: number
  canContinue: boolean
  canFinish: boolean
  resourceWarning?: string | null
}

export interface StudyModalEmits {
  (e: 'read' | 'finish' | 'close'): void
}
