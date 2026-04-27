import type { ToastItem } from './index.types'
import { DEFAULT_TIMEOUT } from './index.constants'

const toasts = ref<ToastItem[]>([])
let nextId: number = 0

function addToast(message: string, type: ToastItem['type'], timeout = DEFAULT_TIMEOUT): void {
  const id: number = nextId++
  const toast: ToastItem = { id, message, type, visible: true }
  toasts.value.push(toast)

  setTimeout(() => dismiss(id), timeout)
}

function dismiss(id: number): void {
  const idx: number = toasts.value.findIndex((toast) => toast.id === id)

  if (idx !== -1) {
    const toast: ToastItem | undefined = toasts.value[idx]

    if (!toast) return

    toast.visible = false

    setTimeout(() => {
      toasts.value = toasts.value.filter((toast) => toast.id !== id)
    }, 300)
  }
}

/**
 * @description [Composable] - provides toast notifications and dismissal helpers.
 * @return { ReturnType } toast collection and toast actions
 */
export const useToast = () => {
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
