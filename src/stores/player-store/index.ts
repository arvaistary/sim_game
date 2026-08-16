import type { LifeBackground, PlayerState } from './player-store.types'

const INITIAL_STATE: PlayerState = {
  name: 'Алексей',
  welcomeScreenShown: false,
  traits: [],
  memories: [],
}

export const usePlayerStore = defineStore('player', () => {
  const name = ref(INITIAL_STATE.name)
  const welcomeScreenShown = ref(INITIAL_STATE.welcomeScreenShown)
  const traits = ref<string[]>([...INITIAL_STATE.traits])
  const memories = ref<string[]>([...INITIAL_STATE.memories])
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

  /**
   * @description [PlayerStore] - Сохраняет traits/memories после prologue handoff.
   * @return { void }
   */
  function setLifeBackground(data: LifeBackground): void {
    traits.value = [...data.traits]
    memories.value = [...data.memories]
  }

  function initialize(): void {
    isInitialized.value = true
  }

  function load(_saveData?: Record<string, unknown>): boolean {
    if (_saveData?.name) name.value = _saveData.name as string
    if (_saveData?.welcomeScreenShown) welcomeScreenShown.value = _saveData.welcomeScreenShown as boolean
    if (Array.isArray(_saveData?.traits)) traits.value = _saveData.traits as string[]
    if (Array.isArray(_saveData?.memories)) memories.value = _saveData.memories as string[]
    isInitialized.value = true
    return true
  }

  function save(): Record<string, unknown> {
    return {
      name: name.value,
      welcomeScreenShown: welcomeScreenShown.value,
      traits: [...traits.value],
      memories: [...memories.value],
    }
  }

  function reset(): void {
    name.value = INITIAL_STATE.name
    welcomeScreenShown.value = INITIAL_STATE.welcomeScreenShown
    traits.value = [...INITIAL_STATE.traits]
    memories.value = [...INITIAL_STATE.memories]
    isInitialized.value = false
  }

  return {
    name,
    welcomeScreenShown,
    traits,
    memories,
    isInitialized,
    isNewPlayer,
    setName,
    showWelcomeScreen,
    hideWelcomeScreen,
    setLifeBackground,
    initialize,
    load,
    save,
    reset,
  }
})
