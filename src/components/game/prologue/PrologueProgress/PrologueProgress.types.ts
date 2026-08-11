import type { PrologueStatus } from '@/domain/prologue/prologue.types'

export interface PrologueProgressProps {
  status: PrologueStatus
}

export interface ProgressStepView {
  id: string
  label: string
  done: boolean
  isCurrent: boolean
}
