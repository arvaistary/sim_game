import type { SkillModifiers } from '@/domain/balance/types'

export type TagModifierActivityAction = 'add' | 'remove' | 'expire'

export interface TagModifierActivityMetadata {
  source: 'tags'
  tagId: string
  action: TagModifierActivityAction
  stacks?: number
  modifiers?: Partial<SkillModifiers>
}

export interface TagModifierActivityDetail {
  category: string
  title: string
  description: string
  icon: string | null
  metadata: TagModifierActivityMetadata
}
