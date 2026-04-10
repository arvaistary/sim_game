import { defineNuxtRouteMiddleware } from '#imports'
import { useGameStore } from '@/stores/game.store'

export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/game')) {
    return
  }

  const gameStore = useGameStore()

  if (!gameStore.isInitialized) {
    gameStore.initWorld()
    gameStore.load()
  }
})

