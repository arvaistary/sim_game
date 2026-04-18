import { PLAYER_ENTITY, TAGS_COMPONENT } from '../../components/index'
import type { GameWorld } from '../../world'
import type { CharacterTag, SkillModifiers } from '@/domain/balance/types'
import { telemetryInc } from '../../utils/telemetry'
import { TimeSystem } from '../TimeSystem'
import type { TagModifierActivityDetail } from './index.types'

export class TagsSystem {
  private world!: GameWorld

  init(world: GameWorld): void {
    this.world = world
    this._ensureComponent()
  }

  update(_world: GameWorld, _deltaTime: number): void {
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

  getTagsByModifier(modifierKey: keyof SkillModifiers | string): CharacterTag[] {
    const key = modifierKey as keyof SkillModifiers
    return this.getTags().filter(tag => {
      if (!tag.modifiers) return false
      return key in tag.modifiers && tag.modifiers[key] !== undefined
    })
  }

  addTag(tag: Omit<CharacterTag, 'stacks'> & { stacks?: number }): void {
    const tags = [...this.getTags()]
    const existingIndex: number = tags.findIndex(t => t.id === tag.id)

    if (existingIndex !== -1) {
      const existing = tags[existingIndex]
      if (existing.stackable) {
        const maxStacks: number = existing.maxStacks || 1
        const prevStacks: number = existing.stacks || 1
        const nextStacks: number = Math.min(prevStacks + (tag.stacks || 1), maxStacks)
        if (nextStacks > prevStacks) {
          telemetryInc(`tag_stack:${tag.id}`)
        }
        existing.stacks = nextStacks
        if (tag.expiresAt) {
          existing.expiresAt = tag.expiresAt
        }
        tags[existingIndex] = existing
        this.world.updateTypedComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: tags })
        return
      }
      return
    }

    const created: CharacterTag = {
      ...tag,
      stacks: tag.stacks || 1,
    }
    tags.push(created)
    this.world.updateTypedComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: tags })
    telemetryInc(`tag_add:${tag.id}`)
    this._emitModifierActivityIfNeeded({
      category: 'tag',
      title: `Тег: ${tag.id}`,
      description: 'Новый временный эффект',
      icon: null,
      metadata: {
        source: 'tags',
        tagId: tag.id,
        action: 'add',
        stacks: created.stacks,
        modifiers: created.modifiers,
      },
    })
  }

  removeTag(tagId: string): void {
    const existing: CharacterTag | null = this.getTag(tagId)
    const tags: CharacterTag[] = this.getTags().filter(tag => tag.id !== tagId)
    this.world.updateTypedComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: tags })
    if (existing) {
      telemetryInc(`tag_remove:${tagId}`)
      this._emitModifierActivityIfNeeded({
        category: 'tag',
        title: `Тег снят: ${tagId}`,
        description: 'Временный эффект закончился или был удалён',
        icon: null,
        metadata: {
          source: 'tags',
          tagId,
          action: 'remove',
          stacks: existing.stacks,
          modifiers: existing.modifiers,
        },
      })
    }
  }

  removeAllTags(): void {
    const before: CharacterTag[] = this.getTags()
    this.world.updateTypedComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: [] })
    for (const t of before) {
      telemetryInc(`tag_remove:${t.id}`)
      this._emitModifierActivityIfNeeded({
        category: 'tag',
        title: `Тег снят: ${t.id}`,
        description: 'Сброс всех тегов',
        icon: null,
        metadata: {
          source: 'tags',
          tagId: t.id,
          action: 'remove',
          stacks: t.stacks,
          modifiers: t.modifiers,
        },
      })
    }
  }

  cleanExpiredTags(): void {
    const timeSystem = this.world.getSystem(TimeSystem)
    if (!timeSystem) return

    const currentHour: number = timeSystem.getTotalHours()
    const all: CharacterTag[] = this.getTags()
    const expired: CharacterTag[] = all.filter(tag => tag.expiresAt !== undefined && tag.expiresAt <= currentHour)
    const activeTags: CharacterTag[] = all.filter(tag => !tag.expiresAt || tag.expiresAt > currentHour)

    if (expired.length === 0) return

    for (const tag of expired) {
      telemetryInc(`tag_expire:${tag.id}`)
      this._emitModifierActivityIfNeeded({
        category: 'tag',
        title: `Истёк тег: ${tag.id}`,
        description: 'Время действия эффекта вышло',
        icon: null,
        metadata: {
          source: 'tags',
          tagId: tag.id,
          action: 'expire',
          stacks: tag.stacks,
          modifiers: tag.modifiers,
        },
      })
    }

    this.world.updateTypedComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: activeTags })
  }

  calculateCombinedModifiers(): Partial<SkillModifiers> {
    const tags = this.getTags()
    const combined: Partial<SkillModifiers> = {}

    for (const tag of tags) {
      if (!tag.modifiers) continue
      const stacks: number = tag.stacks || 1

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

  private _emitModifierActivityIfNeeded(detail: TagModifierActivityDetail): void {
    const mods = detail.metadata.modifiers
    if (!mods || Object.keys(mods).length === 0) return
    this.world.eventBus.dispatchEvent(new CustomEvent('activity:stat', { detail }))
  }

  private _ensureComponent(): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, TAGS_COMPONENT)
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, TAGS_COMPONENT, { items: [] })
    }
  }
}
