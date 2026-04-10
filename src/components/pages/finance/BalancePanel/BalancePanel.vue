<template>
  <RoundedPanel>
    <div class="balance-row">
      <div class="balance-item">
        <span class="balance-label">Наличные</span>
        <span class="balance-value">{{ formatMoney(store.money) }} ₽</span>
      </div>
      <div class="balance-item">
        <span class="balance-label">Резерв</span>
        <span class="balance-value reserve">{{ formatMoney(reserveFund) }} ₽</span>
      </div>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import { useGameStore } from '@/stores/game.store'
import { formatMoney } from '@/utils/format'

const store = useGameStore()

const reserveFund = computed(() => {
  const wallet = store.wallet as unknown as Record<string, unknown> | null
  return (wallet?.reserveFund as number) ?? 0
})
</script>

<style scoped lang="scss" src="./BalancePanel.scss"></style>
