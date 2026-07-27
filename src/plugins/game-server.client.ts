import type { AuthSessionResponse } from '@/middleware/auth.types'

export default defineNuxtPlugin(async () => {
  const authSession: AuthSessionResponse = await $fetch('/api/auth/session')

  if (!authSession.authenticated) return

  const gameStore = useGameStore()

  if (gameStore.gameMode !== 'spa') {
    await gameStore.initializeServerSession()
  }
})
