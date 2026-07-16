export default defineNuxtPlugin(async () => {
  const gameStore = useGameStore()

  if (gameStore.gameMode !== 'spa') {
    await gameStore.initializeServerSession()
  }
})
