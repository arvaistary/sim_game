import type { ProgramStep } from '@/domain/balance/types'

export interface CanStartResult {
  ok: boolean
  reason?: string
}

export interface StartResult {
  success: boolean
  message: string
}

export interface AdvanceResult {
  completed: boolean
  summary: string
}

/** Запись о завершённой программе (книга, курс и т.д.) для UI и сохранений */
export interface CompletedProgramRecord {
  id: string
  name: string
  typeLabel?: string
  completedAtGameDay?: number
}

export interface ActiveCourse {
  id: string
  name: string
  type: string
  progress: number
  daysRequired: number
  daysSpent: number
  hoursRequired: number
  hoursSpent: number
  costPaid: number
  /** Текущий шаг программы */
  currentStepIndex: number
  /** Список шагов программы */
  steps: ProgramStep[]
}
