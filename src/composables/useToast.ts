import { ref } from 'vue'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  visible: boolean
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

const DEFAULT_TIMEOUT = 3000

function addToast(message: string, type: ToastItem['type'], timeout = DEFAULT_TIMEOUT): void {
  const id = nextId++
  const toast: ToastItem = { id, message, type, visible: true }
  toasts.value.push(toast)

  setTimeout(() => dismiss(id), timeout)
}

function dismiss(id: number): void {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx !== -1) {
    toasts.value[idx].visible = false
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 300)
  }
}

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

