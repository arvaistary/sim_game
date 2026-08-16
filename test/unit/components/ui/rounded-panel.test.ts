// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'

describe('RoundedPanel', () => {
  it('applies material state and layout props', () => {
    const wrapper: VueWrapper = mount(RoundedPanel, {
      props: {
        accent: true,
        shadow: false,
        radius: 12,
        padding: '8px',
      },
      slots: { default: 'content' },
    })

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'rounded-panel',
      'rounded-panel--accent',
      'rounded-panel--no-shadow',
    ]))
    expect(wrapper.attributes('style')).toContain('border-radius: 12px')
    expect(wrapper.attributes('style')).toContain('padding: 8px')
    expect(wrapper.text()).toBe('content')
  })
})
