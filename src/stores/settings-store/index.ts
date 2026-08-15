import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'

export type ThemePreference = 'light' | 'dark'
export type DensityPreference = 'comfortable' | 'compact'

/** Accent palette — overrides brand/action/focus CSS tokens only. */
export type PaletteId = 'cobalt' | 'emerald' | 'sunset' | 'violet'

export interface SettingsState {
  theme: ThemePreference
  density: DensityPreference
  sidebarCollapsed: boolean
  onboardingCompleted: boolean
  palette: PaletteId
}

const STORAGE_KEY: string = 'game_life_settings'

const DEFAULT_STATE: SettingsState = {
  theme: 'light',
  density: 'comfortable',
  sidebarCollapsed: false,
  onboardingCompleted: false,
  palette: 'emerald',
}

function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function loadFromStorage(): SettingsState {
  const storage: Storage | null = getStorage()
  if (!storage) return { ...DEFAULT_STATE }

  try {
    const raw: string | null = storage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed: Partial<SettingsState> = JSON.parse(raw) as Partial<SettingsState>
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function saveToStorage(state: SettingsState): void {
  const storage: Storage | null = getStorage()
  if (!storage) return

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / serialize errors
  }
}

/**
 * Pinia store для UI-настроек (тема, плотность, палитра, onboarding).
 * @description [Store] - persisted в localStorage (отдельный от game save ключ).
 */
export const useSettingsStore = defineStore('settings', () => {
  const initialState: SettingsState = loadFromStorage()

  const theme: Ref<ThemePreference> = ref<ThemePreference>(initialState.theme)
  const density: Ref<DensityPreference> = ref<DensityPreference>(initialState.density)
  const sidebarCollapsed: Ref<boolean> = ref<boolean>(initialState.sidebarCollapsed)
  const onboardingCompleted: Ref<boolean> = ref<boolean>(initialState.onboardingCompleted)
  const palette: Ref<PaletteId> = ref<PaletteId>(initialState.palette)

  const isDark: ComputedRef<boolean> = computed<boolean>(() => theme.value === 'dark')
  const isCompact: ComputedRef<boolean> = computed<boolean>(() => density.value === 'compact')

  function persist(): void {
    saveToStorage({
      theme: theme.value,
      density: density.value,
      sidebarCollapsed: sidebarCollapsed.value,
      onboardingCompleted: onboardingCompleted.value,
      palette: palette.value,
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

  /**
   * @description [Store] - задаёт accent-палитру (CSS `data-palette`).
   * @return { void }
   */
  function setPalette(value: PaletteId): void {
    palette.value = value
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
    palette,
    isDark,
    isCompact,
    setTheme,
    setDensity,
    setPalette,
    toggleTheme,
    toggleSidebar,
    completeOnboarding,
    resetOnboarding,
  }
})
