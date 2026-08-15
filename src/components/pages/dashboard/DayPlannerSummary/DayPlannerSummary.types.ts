export type DayRhythmTone = 'overloaded' | 'tired' | 'strained' | 'open' | 'dense' | 'balanced' | 'calm'

export interface DayRhythm {
  tone: DayRhythmTone
  title: string
  intro: string
  mood: string
}

export interface DayRhythmStats {
  energy: number
  health: number
  hunger: number
  stress: number
  mood: number
  physical: number
}

export interface DayRhythmInput {
  availableHours: number
  plannedHours: number
  freeHours: number
  stats: DayRhythmStats
}
