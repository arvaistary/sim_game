export interface ModalEntry {
  id: symbol
  component: Component
  props?: Record<string, unknown>
  zIndex: number
}
