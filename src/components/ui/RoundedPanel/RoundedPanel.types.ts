export type RoundedPanelVariant = 'panel' | 'chrome' | 'inset' | 'solid'

export interface RoundedPanelProps {
  color?: string
  shadow?: boolean
  radius?: number
  padding?: string
  variant?: RoundedPanelVariant
  /** Декоративная accent-полоса слева 3px. */
  accent?: boolean
}
