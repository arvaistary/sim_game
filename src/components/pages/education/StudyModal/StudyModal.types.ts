export interface StudyModalProps {
  isOpen: boolean
  courseName: string
  courseDescription: string
  currentStep: number
  totalSteps: number
  isBook?: boolean
  stepContent?: string
  hoursRemaining: number
  canContinue: boolean
  isReading?: boolean
  canFinish: boolean
  resourceWarning?: string | null
}

export interface StudyModalEmits {
  (e: 'read' | 'finish' | 'close'): void
}
