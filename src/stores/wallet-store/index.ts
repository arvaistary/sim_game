

export interface WalletState {
  money: number
  reserveFund: number
  totalEarned: number
  totalSpent: number
}

const INITIAL_WALLET: WalletState = {
  money: 5000,
  reserveFund: 0,
  totalEarned: 0,
  totalSpent: 0,
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export const useWalletStore = defineStore('wallet', () => {
  const money = ref(INITIAL_WALLET.money)
  const reserveFund = ref(INITIAL_WALLET.reserveFund)
  const totalEarned = ref(INITIAL_WALLET.totalEarned)
  const totalSpent = ref(INITIAL_WALLET.totalSpent)

  const netWorth = computed(() => money.value + reserveFund.value)

  const canAfford = (amount: number): boolean => money.value >= amount

  const earn = (amount: number, addToNetWorth = true): void => {
    money.value += amount
    if (addToNetWorth) {
      totalEarned.value += amount
    }
  }

  const spend = (amount: number, addToNetWorth = true): number => {
    const actualSpend = Math.min(amount, money.value)
    money.value -= actualSpend
    if (addToNetWorth) {
      totalSpent.value += actualSpend
    }
    return actualSpend
  }

  const transferToReserve = (amount: number): void => {
    const transfer = Math.min(amount, money.value)
    money.value -= transfer
    reserveFund.value += transfer
  }

  const transferFromReserve = (amount: number): void => {
    const transfer = Math.min(amount, reserveFund.value)
    reserveFund.value -= transfer
    money.value += transfer
  }

  function setMoney(amount: number): void {
    money.value = clamp(amount, 0, 999_999_999)
  }

  function addMoney(amount: number): void {
    money.value = clamp(money.value + amount, 0, 999_999_999)
  }

  function reset(): void {
    money.value = INITIAL_WALLET.money
    reserveFund.value = INITIAL_WALLET.reserveFund
    totalEarned.value = INITIAL_WALLET.totalEarned
    totalSpent.value = INITIAL_WALLET.totalSpent
  }

  function save(): Record<string, unknown> {
    return {
      money: money.value,
      reserveFund: reserveFund.value,
      totalEarned: totalEarned.value,
      totalSpent: totalSpent.value,
    }
  }

  function load(data: Record<string, unknown>): void {
    if (typeof data.money === 'number') money.value = data.money
    if (typeof data.reserveFund === 'number') reserveFund.value = data.reserveFund
    if (typeof data.totalEarned === 'number') totalEarned.value = data.totalEarned
    if (typeof data.totalSpent === 'number') totalSpent.value = data.totalSpent
  }

  return {
    money,
    reserveFund,
    totalEarned,
    totalSpent,
    netWorth,
    canAfford,
    earn,
    spend,
    transferToReserve,
    transferFromReserve,
    setMoney,
    addMoney,
    reset,
    save,
    load,
  }
})