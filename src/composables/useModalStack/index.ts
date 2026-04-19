import { ref, computed, type Component } from 'vue'

/**
 * Запись модального окна в стеке
 */
export interface ModalEntry {
  id: symbol
  component: Component
  props?: Record<string, any>
  zIndex: number
}

/**
 * Базовый z-index для модальных окон
 */
const BASE_Z_INDEX = 1000
const Z_INDEX_STEP = 10

/**
 * Глобальный стек модальных окон
 */
const stack = ref<ModalEntry[]>([])

/**
 * Composable для управления стеком модальных окон
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
  /**
   * Открыть модальное окно и добавить его в стек
   */
  function open(component: Component, props?: Record<string, any>): symbol {
    const id = Symbol('modal')
    const zIndex = BASE_Z_INDEX + stack.value.length * Z_INDEX_STEP

    stack.value.push({
      id,
      component,
      props,
      zIndex,
    })

    return id
  }

  /**
   * Закрыть модальное окно по ID
   */
  function close(id: symbol): void {
    const index = stack.value.findIndex(entry => entry.id === id)
    if (index !== -1) {
      stack.value.splice(index, 1)
      // Пересчитать z-index для оставшихся модалок
      recalculateZIndexes()
    }
  }

  /**
   * Закрыть все модальные окна
   */
  function closeAll(): void {
    stack.value = []
  }

  /**
   * Пересчитать z-index для всех модалок в стеке
   */
  function recalculateZIndexes(): void {
    stack.value.forEach((entry, index) => {
      entry.zIndex = BASE_Z_INDEX + index * Z_INDEX_STEP
    })
  }

  /**
   * Верхняя модалка в стеке
   */
  const top = computed(() => {
    return stack.value[stack.value.length - 1] || null
  })

  /**
   * Количество открытых модалок
   */
  const count = computed(() => stack.value.length)

  /**
   * Сброс стека (для тестов)
   */
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
