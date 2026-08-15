// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MatchPairs from '@/components/game/minigames/MatchPairs/MatchPairs.vue'

describe('MatchPairs', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('keeps the last pair visible for two seconds before completing', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const wrapper: VueWrapper = mount(MatchPairs)
    const cardButtons: Array<DOMWrapper<HTMLButtonElement>> = wrapper.findAll<HTMLButtonElement>('button')
    const clickPair: (firstIndex: number, secondIndex: number) => Promise<void> = async (firstIndex, secondIndex) => {
      await cardButtons[firstIndex]!.trigger('click')
      await cardButtons[secondIndex]!.trigger('click')
    }

    await clickPair(1, 2)
    await clickPair(3, 4)
    await clickPair(0, 5)

    expect(wrapper.emitted('complete')).toBeUndefined()
    expect(wrapper.find('.match-pairs__completion').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(1999)
    expect(wrapper.emitted('complete')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.emitted('complete')).toHaveLength(1)

    wrapper.unmount()
  })
})
