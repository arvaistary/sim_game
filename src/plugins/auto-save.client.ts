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

const DEBOUNCE_MS = 300
const PERIODIC_MS = 30_000

/** ID stores, которые относятся к игре (подписываемся на их изменения) */
const GAME_STORE_IDS = new Set([
  'game', 'time', 'stats', 'wallet', 'skills', 'career',
  'education', 'housing', 'player', 'events', 'actions',
  'finance', 'activity',
])

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia as Pinia
  const saveRepository = createLocalStorageSaveRepository(DEFAULT_SAVE_KEY)

  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let periodicTimer: ReturnType<typeof setInterval> | null = null
  let saveEnabled = false

  /**
   * Немедленное сохранение текущего состояния игры.
   */
  function flushSave(): void {
    if (!saveEnabled) return

    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    const playerStore = usePlayerStore()

    if (!playerStore.isInitialized) return

    const gameStore = useGameStore()
    const payload: Record<string, unknown> = gameStore.save()
    saveRepository.save(payload)
  }

  /**
   * Debounced сохранение — основной триггер.
   */
  function debouncedSave(): void {
    if (!saveEnabled) return

    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(flushSave, DEBOUNCE_MS)
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
  function clearSave(): void {
    saveEnabled = false
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    saveRepository.clear()
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
      flushSave()
    }
  })

  // --- Periodic save: safety net каждые 30 секунд ---
  periodicTimer = setInterval(flushSave, PERIODIC_MS)

  // --- beforeunload: гарантированное сохранение при уходе со страницы ---
  window.addEventListener('beforeunload', flushSave)

  return {
    provide: {
      autoSave: {
        enable: enableSave,
        flush: flushSave,
        clear: clearSave,
      },
    },
  }
})
