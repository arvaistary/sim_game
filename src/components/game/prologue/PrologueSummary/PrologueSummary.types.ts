import type { PrologueTagPoints } from '@/domain/prologue/prologue.types'

export interface PrologueSummaryProps {
  fantasyLabel: string
  educationLabel: string
  tagPoints: PrologueTagPoints
  traits: string[]
}

export interface PrologueSummaryEmits {
  confirm: []
}
