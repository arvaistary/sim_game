import type { ModalEntry } from './index.types'
import { BASE_Z_INDEX, Z_INDEX_STEP } from './index.constants'

export type { ModalEntry } from './index.types'

/**
 * @description [Composable] - manages a shared modal stack and z-index ordering.
 * @return { ReturnType } modal stack state and stack actions
 */
export const useModalStack = () => {
  const stack = useState<ModalEntry[]>('modal-stack', () => [])

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
    const index: number = stack.value.findIndex((entry) => entry.id === id)

    if (index !== -1) {
      stack.value.splice(index, 1)
      recalculateZIndexes()
    }
  }

  function closeAll(): void {
    stack.value = []
  }

  function recalculateZIndexes(): void {
    stack.value.forEach((entry, index) => {
      entry.zIndex = BASE_Z_INDEX + index * Z_INDEX_STEP
    })
  }

  const top = computed<ModalEntry | null>(() => stack.value[stack.value.length - 1] || null)
  const count = computed<number>(() => stack.value.length)

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