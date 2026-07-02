import type { GameMode } from '@/domain/game-mode'

export interface ModeSwitcherProps {
  /** Текущий режим (из runtimeConfig). */
  currentMode?: GameMode
}

export interface ModeOption {
  id: GameMode
  label: string
  description: string
}
