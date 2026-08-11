import type { PrologueTagId, PrologueTagPoints } from '@/domain/prologue/prologue.types'

export interface PrologueTagChipsProps {
  tagPoints: PrologueTagPoints
}

export interface TagChipView {
  id: PrologueTagId
  label: string
  dots: string
}
