import type { ComputedRef, Ref } from 'vue'
import type { ModalEntry } from './useModalStack.types'

export type { ModalEntry } from './useModalStack.types'

const BASE_Z_INDEX: number = 1000
const Z_INDEX_STEP: number = 10

const stack: Ref<ModalEntry[]> = ref<ModalEntry[]>([])

/**
 * Composable для управления стеком модальных окон.
 * @description [Composable] - предоставляет методы open/close/closeAll и реактивные top/count для стека модалок.
 * @return { object } стек, верхняя модалка, счётчик и методы управления
 *
 * @example
 * ```ts
 * const { open, close, closeAll, top } = useModalStack()
 *
 * // Открыть модалку
 * const modalId = open(MyModalComponent, { title: 'Hello' })
 *
 * // Закрыть конкретную модалку
 * close(modalId)
 *
 * // Закрыть все модалки
 * closeAll()
 *
 * // Получить верхнюю модалку
 * console.log(top.value)
 * ```
 */
export function useModalStack() {
  function open(component: Component, props?: Record<string, unknown>): symbol {
    const id: symbol = Symbol('modal')
    const zIndex: number = BASE_Z_INDEX + stack.value.length * Z_INDEX_STEP

    stack.value.push({
      id,
      component,
      props,
      zIndex,
    })

    return id
  }

  function close(id: symbol): void {
    const index: number = stack.value.findIndex((entry: ModalEntry) => entry.id === id)

    if (index !== -1) {
      stack.value.splice(index, 1)
      recalculateZIndexes()
    }
  }

  function closeAll(): void {
    stack.value = []
  }

  function recalculateZIndexes(): void {
    stack.value.forEach((entry: ModalEntry, index: number) => {
      entry.zIndex = BASE_Z_INDEX + index * Z_INDEX_STEP
    })
  }

  const top: ComputedRef<ModalEntry | null> = computed(() => {
    return stack.value[stack.value.length - 1] ?? null
  })

  const count: ComputedRef<number> = computed(() => stack.value.length)

  function reset(): void {
    stack.value = []
  }

  return {
    stack,
    top,
    count,
    open,
    close,
    closeAll,
    reset,
  }
}
