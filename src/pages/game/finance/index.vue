<template>
  <GameLayout title="Финансы">
    <div class="finance-page">
      <BalancePanel />
      <ExpenseList />
      <FinanceActionList />
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import GameLayout from '@/components/layout/GameLayout/GameLayout.vue'
import BalancePanel from '@/components/pages/finance/BalancePanel/BalancePanel.vue'
import ExpenseList from '@/components/pages/finance/ExpenseList/ExpenseList.vue'
import FinanceActionList from '@/components/pages/finance/FinanceActionList/FinanceActionList.vue'

definePageMeta({ middleware: 'game-init' })
</script>

<style scoped lang="scss">
.finance-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
