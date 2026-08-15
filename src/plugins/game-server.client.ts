import type { AuthSessionResponse } from '@/middleware/auth.types'
import { createLocalStorageSaveRepository } from '@/infrastructure/persistence/LocalStorageSaveRepository'

export default defineNuxtPlugin(async () => {
  const authSession: AuthSessionResponse = await $fetch('/api/auth/session')

  if (!authSession.authenticated) return

  const gameStore = useGameStore()

  if (gameStore.gameMode !== 'spa') {
    const savedData: Record<string, unknown> | null = createLocalStorageSaveRepository().load()

    if (savedData) gameStore.load(savedData)
    await gameStore.initializeServerSession(gameStore.getWorldState())
  }
})
