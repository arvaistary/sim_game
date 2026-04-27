export interface WalletState {
  money: number
  reserveFund: number
  totalEarned: number
  totalSpent: number
}

export interface WalletStore {
  money: number
  reserveFund: number
  totalEarned: number
  totalSpent: number
  netWorth: number
  canAfford: (amount: number) => boolean
  earn: (amount: number, addToNetWorth?: boolean) => void
  spend: (amount: number, addToNetWorth?: boolean) => number
  transferToReserve: (amount: number) => void
  transferFromReserve: (amount: number) => void
  setMoney: (amount: number) => void
  addMoney: (amount: number) => void
  reset: () => void
  save: () => Record<string, unknown>
  load: (data: Record<string, unknown>) => void
}
