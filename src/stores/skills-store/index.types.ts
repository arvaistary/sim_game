export interface SkillsComponent {
  [key: string]: SkillEntry
}

export interface SkillEntry {
  level: number
  xp: number
}

export interface SkillsStore {
  skills: Record<string, SkillEntry>
  skillList: Array<[string, SkillEntry]>
  totalLevels: number
  hasSkill: (key: string) => boolean
  getSkillLevel: (key: string) => number
  getSkillXp: (key: string) => number
  setSkillLevel: (key: string, level: number) => void
  addSkillXp: (key: string, xp: number) => void
  applySkillChanges: (changes: Record<string, number>) => void
  hasSkillLevel: (key: string, requiredLevel: number) => boolean
  initializeSkills: (initialSkills: Record<string, number>) => void
  reset: () => void
  save: () => Record<string, unknown>
  load: (data: Record<string, unknown>) => void
}
