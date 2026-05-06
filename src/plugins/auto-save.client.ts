/**
 * Pinia plugin + Nuxt plugin для автосохранения игры.
 *
 * Три уровня защиты:
 * 1. Debounced save (300ms) — после каждого изменения в любом game store
 * 2. visibilitychange — immediate save при скрытии вкладки
 * 3. Periodic save (30 сек) — safety net
 *
 * Сброс при новой игре: вызов $autoSave.clear() из provide.
 */
import type { Pinia } from 'pinia'
import { createLocalStorageSaveRepository } from '@infrastructure/persistence/LocalStorageSaveRepository'
import { DEFAULT_SAVE_KEY } from '@infrastructure/persistence/constants'
import { persistSave, clearSave } from '@application/game'

const DEBOUNCE_MS: number = 300
const PERIODIC_MS = 30_000

const GAME_STORE_IDS = new Set([
  'game', 'time', 'stats', 'wallet', 'skills', 'career',
  'education', 'housing', 'player', 'events', 'actions',
  'finance', 'activity',
])

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia as Pinia
  const saveRepository = createLocalStorageSaveRepository(DEFAULT_SAVE_KEY)

  let saveTimer: NodeJS.Timeout | null = null
  let periodicTimer: NodeJS.Timeout | null = null
  let saveEnabled: boolean = false

  /**
   * Немедленное сохранение текущего состояния игры.
   */
  async function flushSave(): Promise<void> {
    if (!saveEnabled) return

    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    const playerStore = usePlayerStore()

    if (!playerStore.isInitialized) return

    const gameStore = useGameStore()

    const snapshot = gameStore.collectSnapshot()

    await persistSave(saveRepository, snapshot)
  }

  /**
   * Debounced сохранение — основной триггер.
   */
  function debouncedSave(): void {
    if (!saveEnabled) return

    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void flushSave(), DEBOUNCE_MS)
  }

  /**
   * Включить автосохранение (вызывается после инициализации игры).
   */
  function enableSave(): void {
    saveEnabled = true
  }

  /**
   * Очистить сохранение и отключить автосохранение (новая игра).
   */
  async function clearAndReset(): Promise<void> {
    saveEnabled = false

    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    await clearSave(saveRepository)
  }

  // --- Pinia plugin: подписка на изменения game stores ---
  pinia.use(({ store }) => {
    if (!GAME_STORE_IDS.has(store.$id)) return

    store.$subscribe(() => {
      debouncedSave()
    })
  })

  // --- visibilitychange: immediate save при скрытии вкладки ---
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushSave()
    }
  })

  // --- Periodic save: safety net каждые 30 секунд ---
  periodicTimer = setInterval(() => void flushSave(), PERIODIC_MS)

  // --- beforeunload: гарантированное сохранение при уходе со страницы ---
  window.addEventListener('beforeunload', () => void flushSave())

  return {
    provide: {
      autoSave: {
        enable: enableSave,
        flush: flushSave,
        clear: clearAndReset,
      },
    },
  }
})
