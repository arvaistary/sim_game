import type { SkillDef } from '@domain/balance/types'

export interface SkillWithProgress {
  skill: SkillDef
  level: number
}
