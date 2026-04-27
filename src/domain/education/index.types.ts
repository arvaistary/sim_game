export interface CanAddStudyHoursResult {
  canDo: boolean
  reason?: string
}

export interface NeedsState {
  energy: number
  hunger: number
  stress: number
}

export type CognitiveLoadStatus = 'low' | 'medium' | 'high'
