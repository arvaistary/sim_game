import { ROUTE_MAP } from '@constants/navigation'
import { createLocalStorageSaveRepository } from '@infrastructure/persistence/LocalStorageSaveRepository'

const saveRepository = createLocalStorageSaveRepository()
const NEW_GAME_SESSION_KEY: string = 'gamelife:new-game'

function takeFreshStartFlag(): boolean {
  if (!import.meta.client) return false

  const isFreshStart = sessionStorage.getItem(NEW_GAME_SESSION_KEY) === '1'

  if (isFreshStart) {
    sessionStorage.removeItem(NEW_GAME_SESSION_KEY)
  }

  return isFreshStart
}

export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/game')) {
    return
  }

  const playerStore = usePlayerStore()
  const gameStore = useGameStore()

  const { $autoSave } = useNuxtApp()

  if (!playerStore.isInitialized) {
    const hasFreshStartFlag: boolean = takeFreshStartFlag()

    if (hasFreshStartFlag) {
      playerStore.initialize()
    } else {
      const savedData = saveRepository.load()
      if (savedData) {
        gameStore.load(savedData)
      } else {
        playerStore.initialize()
      }
    }
    // Включаем автосохранение после первой инициализации
    $autoSave.enable()
  }

  const { isTabVisible } = useAgeRestrictions()

  const routeEntry = Object.entries(ROUTE_MAP).find(([_, path]) => path === to.path)

  if (routeEntry) {
    const [tabId] = routeEntry
    if (!isTabVisible(tabId)) {
      return navigateTo('/game')
    }
  }
})