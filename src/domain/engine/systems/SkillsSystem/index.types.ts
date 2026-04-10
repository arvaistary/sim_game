export interface SkillChangeResult {
  changed: boolean
  reason: string
  changes: Record<string, { from: number; to: number; delta: number }>
}
