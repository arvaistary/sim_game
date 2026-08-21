<template>
  <RoundedPanel :radius="16" padding="16px 20px">
    <h3 class="section-title">Расходы</h3>
    <div class="expense-divider" />
    <div class="expense-total">
      <span class="expense-name">За текущий месяц</span>
      <span class="expense-value">{{ expenseTotalLabel }}</span>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'

import { formatMoney } from '@/utils/format'

const financeStore = useFinanceStore()

const expenseTotalLabel: ComputedRef<string> = computed(() => {
  const amount: number = financeStore.totalExpense
  if (amount <= 0) return `${formatMoney(0)} ₽`
  return `–${formatMoney(amount)} ₽`
})
</script>

<style scoped lang="scss" src="./ExpenseList.scss"></style>
