import type { PaletteId } from '@/stores/settings-store'

export interface PaletteOption {
  id: PaletteId
  label: string
  swatch: string
}
