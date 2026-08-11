import type { PrologueTrack } from '@/domain/prologue/prologue.types'

export interface PrologueForkSelectEmits {
  select: [track: PrologueTrack]
}
