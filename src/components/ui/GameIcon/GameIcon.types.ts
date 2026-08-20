import type { GameIconName } from '@/constants/game-icons.types'

export type { GameIconName } from '@/constants/game-icons.types'

export type GameIconProps = {
  name: GameIconName
  size?: number
  strokeWidth?: number
  variant?: 'stroke' | 'fill'
}
