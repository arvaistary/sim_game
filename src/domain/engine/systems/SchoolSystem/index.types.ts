import type { SchoolComponent } from '@/domain/engine/types'

export type { SchoolComponent }

/**
 * Снимок для UI / запросов
 */
export interface SchoolStatus {
  enrolled: boolean
  grade: number
  attendance: number
  totalDays: number
  skippedDays: number
  attendanceRate: number
  grades: Record<number, number>
}
