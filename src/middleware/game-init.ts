import { ROUTE_MAP } from '@constants/navigation'
import { createLocalStorageSaveRepository } from '@infrastructure/persistence/LocalStorageSaveRepository'
import { restoreSave } from '@application/game'

const saveRepository = createLocalStorageSaveRepository()
const NEW_GAME_SESSION_KEY: string = 'gamelife:new-game'

function takeFreshStartFlag(): boolean {
  if (!import.meta.client) return false

  const isFreshStart: boolean = sessionStorage.getItem(NEW_GAME_SESSION_KEY) === '1'

  if (isFreshStart) {
    sessionStorage.removeItem(NEW_GAME_SESSION_KEY)
  }

  return isFreshStart
}

export default defineNuxtRouteMiddleware(async (to) => {
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
      const result = await restoreSave(saveRepository)

      if (result.data) {
        gameStore.load(result.data as unknown as Record<string, unknown>)
      } else {
        playerStore.initialize()
      }
    }

    $autoSave.enable()
  }

  const { isTabVisible } = useAgeRestrictions()

  const routeEntry: boolean = Object.entries(ROUTE_MAP).find(([_, path]) => path === to.path)

  if (routeEntry) {
    const [tabId] = routeEntry

    if (!isTabVisible(tabId)) {
      return navigateTo('/game')
    }
  }
})
