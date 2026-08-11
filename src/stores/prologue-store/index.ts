import type { Ref, ComputedRef } from 'vue'
import { toRaw } from 'vue'
import {
  startPrologue,
  choosePrologueOption,
  selectPrologueTrack,
  submitPrologueExam,
  completePrologue,
  resumePrologue,
  buildPrologueHandoffPatch,
} from '@/domain/prologue'
import type {
  PrologueHandoffPatch,
  PrologueSceneInstance,
  PrologueState,
  PrologueStatus,
  PrologueTagPoints,
  PrologueTrack,
} from '@/domain/prologue/prologue.types'
import type { PrologueStoreSaveBlob } from './prologue-store.types'

export const usePrologueStore = defineStore('prologue', () => {
  const state: Ref<PrologueState | null> = ref<PrologueState | null>(null)

  const isActive: ComputedRef<boolean> = computed(() => {
    return state.value !== null && !state.value.prologueCompleted && state.value.status !== 'completed'
  })

  const status: ComputedRef<PrologueStatus | null> = computed(() => state.value?.status ?? null)
  const pendingScene: ComputedRef<PrologueSceneInstance | null> = computed(() => state.value?.pendingScene ?? null)
  const tagPoints: ComputedRef<PrologueTagPoints | null> = computed(() => state.value?.tagPoints ?? null)
  const track: ComputedRef<PrologueTrack | null> = computed(() => state.value?.track ?? null)
  const traits: ComputedRef<string[]> = computed(() => state.value?.traits ?? [])
  const memories: ComputedRef<string[]> = computed(() => state.value?.memories ?? [])

  /**
   * @description [PrologueStore] - Старт нового пролога.
   * @return { void }
   */
  function start(playerName: string, seed?: number): void {
    state.value = startPrologue({ playerName, seed })
  }

  /**
   * @description [PrologueStore] - Выбор в сцене.
   * @return { void }
   */
  function choose(choiceIndex: number): void {
    if (!state.value) return
    state.value = choosePrologueOption(state.value, choiceIndex)
  }

  /**
   * @description [PrologueStore] - Обязательный fork.
   * @return { void }
   */
  function selectTrack(nextTrack: PrologueTrack): void {
    if (!state.value) return
    state.value = selectPrologueTrack(state.value, nextTrack)
  }

  /**
   * @description [PrologueStore] - Сдать экзамен (только multiplier).
   * @return { void }
   */
  function submitExam(correctCount: number): void {
    if (!state.value) return
    state.value = submitPrologueExam(state.value, correctCount)
  }

  /**
   * @description [PrologueStore] - Resume pending scene.
   * @return { void }
   */
  function resume(): void {
    if (!state.value) return
    state.value = resumePrologue(state.value)
  }

  /**
   * @description [PrologueStore] - Построить handoff-патч.
   * @return { PrologueHandoffPatch } патч
   */
  function buildHandoff(): PrologueHandoffPatch {
    if (!state.value) throw new Error('No prologue state')
    return buildPrologueHandoffPatch(state.value)
  }

  /**
   * @description [PrologueStore] - Пометить пролог завершённым.
   * @return { void }
   */
  function markCompleted(): void {
    if (!state.value) return
    state.value = completePrologue(state.value)
  }

  /**
   * @description [PrologueStore] - Сохранить blob.
   * @return { PrologueStoreSaveBlob } сейв
   */
  function save(): PrologueStoreSaveBlob {
    if (!state.value) return { prologue: null }

    const rawState: PrologueState = toRaw(state.value)

    return {
      prologue: JSON.parse(JSON.stringify(rawState)) as PrologueState,
    }
  }

  /**
   * @description [PrologueStore] - Загрузить blob.
   * @return { void }
   */
  function load(data?: Record<string, unknown>): void {
    const blob: PrologueStoreSaveBlob | undefined = data as PrologueStoreSaveBlob | undefined

    if (blob?.prologue) {
      state.value = resumePrologue(blob.prologue as PrologueState)
      return
    }

    state.value = null
  }

  /**
   * @description [PrologueStore] - Сброс.
   * @return { void }
   */
  function reset(): void {
    state.value = null
  }

  return {
    state,
    isActive,
    status,
    pendingScene,
    tagPoints,
    track,
    traits,
    memories,
    start,
    choose,
    selectTrack,
    submitExam,
    resume,
    buildHandoff,
    markCompleted,
    save,
    load,
    reset,
  }
})
