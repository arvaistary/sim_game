import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemePreference = 'light' | 'dark'
export type DensityPreference = 'comfortable' | 'compact'

export interface SettingsState {
  theme: ThemePreference
  density: DensityPreference
  sidebarCollapsed: boolean
  onboardingCompleted: boolean
}

const STORAGE_KEY = 'game_life_settings'

const DEFAULT_STATE: SettingsState = {
  theme: 'light',
  density: 'comfortable',
  sidebarCollapsed: false,
  onboardingCompleted: false,
}

function loadFromStorage(): SettingsState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw) as Partial<SettingsState>
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function saveToStorage(state: SettingsState): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / serialize errors
  }
}

/**
 * Pinia store для UI-настроек (тема, плотность, onboarding).
 * @description [Store] - persisted в localStorage (отдельный от game save ключ).
 */
export const useSettingsStore = defineStore('settings', () => {
  const initialState = loadFromStorage()

  const theme = ref<ThemePreference>(initialState.theme)
  const density = ref<DensityPreference>(initialState.density)
  const sidebarCollapsed = ref<boolean>(initialState.sidebarCollapsed)
  const onboardingCompleted = ref<boolean>(initialState.onboardingCompleted)

  const isDark = computed<boolean>(() => theme.value === 'dark')
  const isCompact = computed<boolean>(() => density.value === 'compact')

  function persist(): void {
    saveToStorage({
      theme: theme.value,
      density: density.value,
      sidebarCollapsed: sidebarCollapsed.value,
      onboardingCompleted: onboardingCompleted.value,
    })
  }

  function setTheme(value: ThemePreference): void {
    theme.value = value
    persist()
  }

  function setDensity(value: DensityPreference): void {
    density.value = value
    persist()
  }

  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    persist()
  }

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
    persist()
  }

  function completeOnboarding(): void {
    onboardingCompleted.value = true
    persist()
  }

  function resetOnboarding(): void {
    onboardingCompleted.value = false
    persist()
  }

  return {
    theme,
    density,
    sidebarCollapsed,
    onboardingCompleted,
    isDark,
    isCompact,
    setTheme,
    setDensity,
    toggleTheme,
    toggleSidebar,
    completeOnboarding,
    resetOnboarding,
  }
})
