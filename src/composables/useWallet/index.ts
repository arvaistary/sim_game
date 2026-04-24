
export const useWallet = () => {
  const walletStore = useWalletStore()

  return {
    money: computed(() => walletStore.money),
    reserveFund: computed(() => walletStore.reserveFund),
    totalEarned: computed(() => walletStore.totalEarned),
    totalSpent: computed(() => walletStore.totalSpent),
    netWorth: computed(() => walletStore.netWorth),
    canAfford: walletStore.canAfford,
    earn: walletStore.earn,
    spend: walletStore.spend,
    transferToReserve: walletStore.transferToReserve,
    transferFromReserve: walletStore.transferFromReserve,
    setMoney: walletStore.setMoney,
    addMoney: walletStore.addMoney,
    reset: walletStore.reset,
  }
}