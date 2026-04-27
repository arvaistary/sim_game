import type { RecoveryTab, RecoveryCard } from '@domain/balance/types'

export interface ExtendedRecoveryCard extends RecoveryCard {
  reserveDelta?: number
  investmentReturn?: number
  investmentDurationDays?: number
}

export interface ExtendedRecoveryTab extends Omit<RecoveryTab, 'cards'> {
  cards: ExtendedRecoveryCard[]
}