import { PLAYER_ENTITY, TAGS_COMPONENT } from '../../components/index'
import type { GameWorld } from '../../world'
import type { CharacterTag, SkillModifiers } from '@/domain/balance/types'
import { TimeSystem } from '../TimeSystem'

export class TagsSystem {
  private world!: GameWorld

  init(world: GameWorld): void {
    this.world = world
    this._ensureComponent()
  }

  update(world: GameWorld, deltaTime: number): void {
    this.cleanExpiredTags()
  }

  getTags(): CharacterTag[] {
    const component = this.world.getTypedComponent(PLAYER_ENTITY, TAGS_COMPONENT)
    return component?.items || []
  }

  hasTag(tagId: string): boolean {
    return this.getTags().some(tag => tag.id === tagId)
  }

  getTag(tagId: string): CharacterTag | null {
    return this.getTags().find(tag => tag.id === tagId) || null
  }

  addTag(tag: Omit<CharacterTag, 'stacks'> & { stacks?: number }): void {
    const tags = [...this.getTags()]
    const existingIndex = tags.findIndex(t => t.id === tag.id)

    if (existingIndex !== -1) {
      const existing = tags[existingIndex]
      if (existing.stackable) {
        const maxStacks = existing.maxStacks || 1
        existing.stacks = Math.min((existing.stacks || 1) + (tag.stacks || 1), maxStacks)
        if (tag.expiresAt) {
          existing.expiresAt = tag.expiresAt
        }
        tags[existingIndex] = existing
      }
    } else {
      tags.push({
        ...tag,
        stacks: tag.stacks || 1,
      })
    }

    this.world.updateTypedComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: tags })
  }

  removeTag(tagId: string): void {
    const tags = this.getTags().filter(tag => tag.id !== tagId)
    this.world.updateTypedComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: tags })
  }

  removeAllTags(): void {
    this.world.updateTypedComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: [] })
  }

  cleanExpiredTags(): void {
    const timeSystem = this.world.getSystem(TimeSystem)
    if (!timeSystem) return

    const currentHour = timeSystem.getTotalHours()
    const activeTags = this.getTags().filter(tag => {
      return !tag.expiresAt || tag.expiresAt > currentHour
    })

    this.world.updateTypedComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: activeTags })
  }

  calculateCombinedModifiers(): Partial<SkillModifiers> {
    const tags = this.getTags()
    const combined: Partial<SkillModifiers> = {}

    for (const tag of tags) {
      if (!tag.modifiers) continue
      const stacks = tag.stacks || 1

      for (const [key, value] of Object.entries(tag.modifiers)) {
        const modifierKey = key as keyof SkillModifiers
        if (combined[modifierKey] === undefined) {
          combined[modifierKey] = 0
        }
        combined[modifierKey]! += (value as number) * stacks
      }
    }

    return combined
  }

  private _ensureComponent(): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, TAGS_COMPONENT)
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: [] })
    }
  }
}
