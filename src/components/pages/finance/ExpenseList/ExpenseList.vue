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
import { computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
import { formatMoney } from '@/utils/format'
import { EXPENSE_LABELS_RU } from '@/constants/metric-labels'

const store = useGameStore()

const expenseLabels = EXPENSE_LABELS_RU

const monthlyExpenses = computed(() => {
  void store.worldTick
  const snapshot = store.getFinanceSnapshot() as Record<string, unknown> | null
  return (snapshot?.monthlyExpenses as Record<string, number>) ?? {}
})

const totalExpenses = computed(() => {
  return Object.values(monthlyExpenses.value).reduce((sum, v) => sum + v, 0)
})
</script>

<style scoped lang="scss" src="./ExpenseList.scss"></style>
