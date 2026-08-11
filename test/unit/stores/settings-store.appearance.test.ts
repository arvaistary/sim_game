import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings-store'
import type { SettingsState } from '@/stores/settings-store'

const STORAGE_KEY: string = 'game_life_settings'

describe('settings-store — palette', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('должен инициализироваться с emerald по умолчанию', () => {
    const settings = useSettingsStore()
    expect(settings.palette).toBe('emerald')
  })

  it('должен применять default palette при загрузке legacy-настроек без palette', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'dark', density: 'compact' }))
    const settings = useSettingsStore()
    expect(settings.theme).toBe('dark')
    expect(settings.palette).toBe('emerald')
  })

  it('setPalette должен переключать палитру и персистить', () => {
    const settings = useSettingsStore()
    settings.setPalette('violet')
    expect(settings.palette).toBe('violet')

    const stored: Partial<SettingsState> = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<SettingsState>
    expect(stored.palette).toBe('violet')
  })

  it('должен восстанавливать выбранную палитру после "перезагрузки" store', () => {
    const first = useSettingsStore()
    first.setPalette('sunset')

    setActivePinia(createPinia())
    const second = useSettingsStore()
    expect(second.palette).toBe('sunset')
  })

  it('игнорирует ошибки сериализации localStorage при персисте', () => {
    const settings = useSettingsStore()
    const setItemSpy: MockInstance = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    expect(() => settings.setPalette('cobalt')).not.toThrow()

    setItemSpy.mockRestore()
  })
})
