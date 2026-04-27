import type { CompletedProgramRecord } from '@stores/education-store'

export type CourseTile =
  | { key: string; status: 'active' }
  | { key: string; status: 'completed'; record: CompletedProgramRecord }

export interface Needs {
  energy: number
  hunger: number
  stress: number
}

export interface CognitiveLoadStatusObject {
  label: string
  description: string
}
