<template>
  <RoundedPanel :radius="16" padding="16px 20px">
    <div class="balance-row">
      <div class="balance-item">
        <span class="balance-label">На руках</span>
        <span class="balance-value">{{ formatMoney(walletStore.money) }} ₽</span>
      </div>
      <div class="balance-item">
        <span class="balance-label">Доход за месяц</span>
        <span class="balance-value">{{ formatMoney(walletStore.totalEarned) }} ₽</span>
      </div>
      <div class="balance-item">
        <span class="balance-label">Баланс</span>
        <span class="balance-value">{{ formatMoney(walletStore.netWorth) }} ₽</span>
      </div>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { formatMoney } from '@/utils/format'

import './BalancePanel.scss'

const walletStore = useWalletStore()

</script>
