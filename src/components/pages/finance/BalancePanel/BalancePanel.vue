<template>
  <RoundedPanel>
    <div class="balance-row">
      <div class="balance-item">
        <span class="balance-label">Наличные</span>
        <span class="balance-value">{{ formatMoney(walletStore.money ?? store.money) }} ₽</span>
      </div>
      <div class="balance-item">
        <span class="balance-label">Резерв</span>
        <span class="balance-value reserve">{{ formatMoney(reserveFund) }} ₽</span>
      </div>
      <div class="balance-item">
        <span class="balance-label">Потрачено</span>
        <span class="balance-value spent">{{ formatMoney(totalSpent) }} ₽</span>
      </div>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './BalancePanel.scss'

import { formatMoney } from '@/utils/format'

const walletStore = useWalletStore()

const reserveFund = computed(() => walletStore.reserveFund)
const totalSpent = computed(() => walletStore.totalSpent)
</script>

