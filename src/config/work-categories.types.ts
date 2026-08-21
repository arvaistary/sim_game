import type { GameIconName } from '@/constants/game-icons.types'

export interface WorkType {
  id: 'full-time' | 'part-time'
  label: string
  subtitle: string
  icon: GameIconName
  scheduleFilter: string[]
}

export interface Industry {
  id: string
  label: string
  icon: GameIconName
}
