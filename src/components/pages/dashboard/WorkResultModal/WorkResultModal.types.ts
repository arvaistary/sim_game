import type { WorkStatDiff } from '../WorkButton/WorkButton.types'

export interface WorkResultModalProps {
  workSummary: string
  statDiffs: WorkStatDiff[]
}

export interface WorkResultModalEmits {
  close: []
}
