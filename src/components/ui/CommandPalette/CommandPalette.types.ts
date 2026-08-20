import type { GameIconName } from '@/components/ui/GameIcon/GameIcon.types'

export type CommandPaletteItem = {
  id: string
  label: string
  icon: GameIconName
  group: string
  action: () => void
}
