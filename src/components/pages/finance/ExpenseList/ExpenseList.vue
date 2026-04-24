<template>
  <RoundedPanel>
    <h3 class="section-title">Постоянные ежемесячные расходы</h3>
    <div class="expense-list">
      <div v-for="(value, key) in monthlyExpenses" :key="key" class="expense-row">
        <span class="expense-name">{{ expenseLabels[key] || key }}</span>
        <span class="expense-value">{{ formatMoney(value) }} ₽</span>
      </div>
      <div class="expense-row total">
        <span class="expense-name">Итого</span>
        <span class="expense-value">{{ formatMoney(totalExpenses) }} ₽</span>
      </div>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './ExpenseList.scss'

import { formatMoney } from '@/utils/format'

import { EXPENSE_LABELS_RU } from '@/constants/metric-labels'

const financeStore = useFinanceStore()

const expenseLabels = EXPENSE_LABELS_RU

const monthlyExpenses = computed(() => {
  const expenses = financeStore.monthlyExpenses
  if (expenses && expenses.length > 0) {
    const expenseMap: Record<string, number> = {}
    for (const exp of expenses) {
      expenseMap[exp.category] = exp.amount
    }

    return expenseMap
  }

  return {}
})

const totalExpenses = computed(() => {
  return financeStore.totalExpense
})
</script>

