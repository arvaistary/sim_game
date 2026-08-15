/**
 * Очищает текущее сохранение и возвращает игрока к стартовому экрану.
 * @description [Composable] - сбрасывает серверную сессию и локальное состояние игры.
 * @return { void } ничего не возвращает
 */
export function useNewGame() {
  const { $autoSave } = useNuxtApp()
  const gameStore = useGameStore()
  const toast = useToast()

  async function startNewGame(): Promise<void> {
    try {
      await gameStore.resetServerSession()
    } catch (error) {
      toast.showError(error instanceof Error ? error.message : 'Не удалось начать новую игру')
      return
    }

    $autoSave.clear()
    gameStore.resetGame()
    await navigateTo('/')
  }

  return {
    startNewGame,
  }
}
