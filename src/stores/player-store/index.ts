
import type { PlayerState } from './index.types'
import { INITIAL_STATE } from './index.constants'

export const usePlayerStore = defineStore('player', () => {
  const name = ref<string>(INITIAL_STATE.name)
  const welcomeScreenShown = ref<boolean>(INITIAL_STATE.welcomeScreenShown)
  const isInitialized = ref<boolean>(false)

  const isNewPlayer = computed<boolean>(() => !welcomeScreenShown.value)

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
    if (typeof _saveData?.name === 'string') name.value = _saveData.name

    if (typeof _saveData?.welcomeScreenShown === 'boolean') welcomeScreenShown.value = _saveData.welcomeScreenShown
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
