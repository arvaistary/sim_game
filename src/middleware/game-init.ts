import { defineNuxtRouteMiddleware, navigateTo } from '#imports'
import { useGameStore } from '@/stores/game.store'
import { useAgeRestrictions } from '@/composables/useAgeRestrictions'
import { ROUTE_MAP } from '@/constants/navigation'

export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/game')) {
    return
  }

  const gameStore = useGameStore()

  if (!gameStore.isInitialized) {
    gameStore.initWorld()
    gameStore.load()
  }

  // Проверка возрастных ограничений для маршрутов
  const { isTabVisible } = useAgeRestrictions()

  // Найдём id вкладки по маршруту
  const routeEntry = Object.entries(ROUTE_MAP).find(([_, path]) => path === to.path)

  if (routeEntry) {
    const [tabId] = routeEntry
    if (!isTabVisible(tabId)) {
      return navigateTo('/game')
    }
  }
})

