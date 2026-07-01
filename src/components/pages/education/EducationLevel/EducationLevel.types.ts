import type { CompletedProgramRecord } from '@/stores/education-store'

export type CourseTile =
  | { key: string; status: 'active' }
  | { key: string; status: 'completed'; record: CompletedProgramRecord }
