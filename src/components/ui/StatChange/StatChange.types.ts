import type { GameIconName } from '@/components/ui/GameIcon/GameIcon.types'

export interface StatChangeDisplay {
  icon: GameIconName
  name: string
  value: number
  isPositive: boolean
}

export interface StatChangeProps {
  text: string
  explanation?: string
}
