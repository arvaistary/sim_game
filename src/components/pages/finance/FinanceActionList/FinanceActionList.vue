<template>
  <RoundedPanel>
    <h3 class="section-title">Действия</h3>
    <div v-if="financeActions.length > 0" class="action-list">
      <div
        v-for="action in financeActions"
        :key="action.id"
        :class="['action-card', { 'action-card--disabled': action.available === false }]"
        @click="handleAction(action)"
      >
        <div class="action-header">
          <span class="action-title">{{ action.title }}</span>
          <span class="action-amount">{{ formatMoney(action.amount) }} ₽</span>
        </div>
        <p class="action-desc">{{ action.description }}</p>
        <p v-if="action.available === false && action.reason" class="action-reason">{{ action.reason }}</p>
      </div>
    </div>
    <p v-else class="finance-empty">{{ financeEmptyHint }}</p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import type { FinanceActionItem } from './FinanceActionList.types'
import { formatMoney } from '@/utils/format'

const store = useGameStore()

const financeStore = useFinanceStore()

const toast = useToast()
const { ageGroupLabel } = useAgeRestrictions()

const financeEmptyHint: ComputedRef<string> = computed(
  () =>
    `Для этапа «${ageGroupLabel.value}» нет доступных финансовых операций. Раздел откроется с возраста, когда вкладка «Финансы» станет активной.`,
)

const financeActions = computed<FinanceActionItem[]>(() => {
  void store.worldTick
  void financeStore.totalExpense
  const actions: FinanceActionItem[] = store.getFinanceActions() as FinanceActionItem[]
  return actions.length > 0 ? actions : []
})

function handleAction(action: FinanceActionItem): void {
  if (action.available === false) {
    toast.showError(action.reason || 'Действие недоступно')
    return
  }

  if (!store.isInitialized) {
    toast.showError('Мир не инициализирован')
    return
  }

  const result: string = store.executeAction(action.id).message

  if (result && !result.startsWith('Мир не')) {
    const baseEffect: string | undefined = (action as unknown as { effect?: string }).effect
    showGameResultModal(action.title, result, { baseEffect })
  } else {
    toast.showError(result || 'Не удалось выполнить действие')
  }
}
</script>

<style scoped lang="scss" src="./FinanceActionList.scss"></style>
