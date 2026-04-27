import type { WorkOptions } from '../WorkButton/WorkButton.types'

export interface WorkChoiceModalProps {
  workOptions: WorkOptions | null
  isWorkInProgress: boolean
  canStartOneDayShift: boolean
  canStartFullShift: boolean
  onRunShift?: (hours: number) => void
}