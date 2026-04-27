export interface LifeMemoryEntry {
  id: string
  age: number
  summary: string
  emotionalWeight: number
  tags: string[]
  sourceEventId?: string
  sourceChoiceLabel?: string
  gameDay: number
  active: boolean
}

export interface LifeMemoryComponent {
  memories: LifeMemoryEntry[]
  childhoodScore: number
}

export interface MemoryByAgeRange {
  child: number
  adolescent: number
  adult: number
}

export interface MemoryStats {
  total: number
  active: number
  byTag: Record<string, number>
  byAgeRange: MemoryByAgeRange
}
