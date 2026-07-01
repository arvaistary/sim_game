export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  visible: boolean
}
