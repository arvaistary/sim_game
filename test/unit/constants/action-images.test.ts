import { describe, expect, it } from 'vitest'

import { getActionImageUrl } from '@/constants/action-images'

describe('getActionImageUrl', () => {
  it('returns fun action image path when category is integrated', () => {
    const url: string | undefined = getActionImageUrl({
      actionId: 'fun_fishing',
      category: 'fun',
    })

    expect(url).toBe('/image/actions/fun-fishing.png')
  })

  it('returns hobby action image path when category is integrated', () => {
    const url: string | undefined = getActionImageUrl({
      actionId: 'hob_drawing',
      category: 'hobby',
    })

    expect(url).toBe('/image/actions/hob-drawing.png')
  })

  it('returns health action image path when category is integrated', () => {
    const url: string | undefined = getActionImageUrl({
      actionId: 'health_checkup',
      category: 'health',
    })

    expect(url).toBe('/image/actions/health-checkup.png')
  })

  it('returns social action image path when category is integrated', () => {
    const url: string | undefined = getActionImageUrl({
      actionId: 'social_meet_friend',
      category: 'social',
    })

    expect(url).toBe('/image/actions/social-meet-friend.png')
  })

  it('returns undefined for unknown category', () => {
    const url: string | undefined = getActionImageUrl({
      actionId: 'shop_quick_snack',
      category: 'shop',
    })

    expect(url).toBeUndefined()
  })
})
