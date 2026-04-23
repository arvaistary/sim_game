import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PlayerState {
  name: string
  welcomeScreenShown: boolean
}

const INITIAL_STATE: PlayerState = {
  name: 'Алексей',
  welcomeScreenShown: false,
}

export const usePlayerStore = defineStore('player', () => {
  const name = ref(INITIAL_STATE.name)
  const welcomeScreenShown = ref(INITIAL_STATE.welcomeScreenShown)
  const isInitialized = ref(false)

  const isNewPlayer = computed(() => !welcomeScreenShown.value)

  function setName(newName: string): void {
    name.value = newName
  }

  function showWelcomeScreen(): void {
    welcomeScreenShown.value = true
  }

  function hideWelcomeScreen(): void {
    welcomeScreenShown.value = false
  }

  function initialize(): void {
    isInitialized.value = true
  }

  function load(_saveData?: Record<string, unknown>): boolean {
    if (_saveData?.name) name.value = _saveData.name as string
    if (_saveData?.welcomeScreenShown) welcomeScreenShown.value = _saveData.welcomeScreenShown as boolean
    isInitialized.value = true
    return true
  }

  function save(): Record<string, unknown> {
    return {
      name: name.value,
      welcomeScreenShown: welcomeScreenShown.value,
    }
  }

  function reset(): void {
    name.value = INITIAL_STATE.name
    welcomeScreenShown.value = INITIAL_STATE.welcomeScreenShown
    isInitialized.value = false
  }

  return {
    name,
    welcomeScreenShown,
    isInitialized,
    isNewPlayer,
    setName,
    showWelcomeScreen,
    hideWelcomeScreen,
    initialize,
    load,
    save,
    reset,
  }
})