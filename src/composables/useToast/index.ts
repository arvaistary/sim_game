import type { Ref } from 'vue'
import type { ToastItem } from './useToast.types'

export type { ToastItem } from './useToast.types'

const toasts: Ref<ToastItem[]> = ref<ToastItem[]>([])
let nextId: number = 0

const DEFAULT_TIMEOUT: number = 3000

function addToast(message: string, type: ToastItem['type'], timeout: number = DEFAULT_TIMEOUT): void {
  const id: number = nextId++
  const toast: ToastItem = { id, message, type, visible: true }
  toasts.value.push(toast)

  setTimeout(() => dismiss(id), timeout)
}

function dismiss(id: number): void {
  const idx: number = toasts.value.findIndex((t: ToastItem) => t.id === id)

  if (idx !== -1) {
    toasts.value[idx]!.visible = false
    setTimeout(() => {
      toasts.value = toasts.value.filter(
        (t: ToastItem) => t.id !== id
      )
    }, 300)
  }
}

/**
 * Composable для отображения toast-уведомлений.
 * @description [Composable] - предоставляет методы showSuccess/showError/showWarning/showInfo для всплывающих уведомлений.
 * @return { object } список тостов и методы показа и скрытия
 */
export function useToast() {
  function showSuccess(message: string): void {
    addToast(message, 'success')
  }

  function showError(message: string): void {
    addToast(message, 'error')
  }

  function showWarning(message: string): void {
    addToast(message, 'warning')
  }

  function showInfo(message: string): void {
    addToast(message, 'info')
  }

  return {
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismiss,
  }
}
