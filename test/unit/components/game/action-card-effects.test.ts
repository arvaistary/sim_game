import { describe, expect, it } from 'vitest'

import type { ActionEffectDisplay } from '@/components/game/ActionCard/ActionCard.types'
import { createSkillEffects } from '@/components/game/ActionCard/action-card-effects'

describe('action card skill effects', () => {
  it('names developed skills without promising a numeric gain', () => {
    const effects: ActionEffectDisplay[] = createSkillEffects({ cooking: 2.5 })

    expect(effects).toHaveLength(1)
    expect(effects[0]!.text).toContain('Кулинария')
    expect(effects[0]!.text).not.toContain('2.5')
    expect(effects[0]!.text).not.toContain('+')
  })

  it('puts the main skill first', () => {
    const effects: ActionEffectDisplay[] = createSkillEffects({ basicCreativity: 3, artisticMastery: 3.5 })

    expect(effects).toHaveLength(2)
    expect(effects[0]!.id).toBe('skill-artisticMastery')
  })
})
