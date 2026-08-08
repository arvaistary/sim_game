export type WorkStatKey = 'money' | 'energy' | 'hunger' | 'stress' | 'mood' | 'health' | 'physical' | 'workedHoursCurrentWeek'

export interface WorkStatDiff {
  key: WorkStatKey
  label: string
  before: number
  after: number
  delta: number
}

export interface WorkResultModalProps {
  workSummary: string
  statDiffs: WorkStatDiff[]
}

export interface WorkResultModalEmits {
  close: []
}
