<template>
  <RoundedPanel>
    <h3 class="section-title">
      Действия
    </h3>
    <div
      v-if="financeActions.length > 0"
      class="action-list"
      >
      <div
        v-for="action in financeActions"
        :key="action.id"
        :class="['action-card', { 'action-card--disabled': action.available === false }]"
        @click="handleAction(action)"
      >
        <div class="action-header">
          <span class="action-title">
            {{ action.title }}
          </span>
          <span class="action-amount">
            {{ formatMoney(action.amount) }} ₽
          </span>
        </div>
        <p class="action-desc">
          {{ action.description }}
        </p>
        <p
          v-if="action.available === false && action.reason"
          class="action-reason"
          >
          {{ action.reason }}
        </p>
      </div>
    </div>
    <p
      v-else
      class="finance-empty"
      >
      {{ financeEmptyHint }}
    </p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import './FinanceActionList.scss'

import type { FinanceActionItem } from './FinanceActionList.types'
import { formatMoney } from '@utils/format'

const walletStore = useWalletStore()
const financeStore = useFinanceStore()

const toast = useToast()
const { ageGroupLabel } = useAgeRestrictions()

const isInitialized = ref<boolean>(true)

const financeEmptyHint = computed<string>(
  () =>
    `Для этапа «${ageGroupLabel.value}» нет доступных финансовых операций. Раздел откроется с возраста, когда вкладка «Финансы» станет активной.`,
)

const financeActions = computed<FinanceActionItem[]>(() => {
  void financeStore.totalExpense

  return [] as FinanceActionItem[]
})

function handleAction(action: FinanceActionItem): void {
  if (action.available === false) {
    toast.showError(action.reason || 'Действие недоступно')

    return
  }

  if (!isInitialized.value) {
    toast.showError('Система не инициализирована')

    return
  }

  const result = walletStore.canAfford(action.amount ?? 0)

  if (!result) {
    toast.showError('Недостаточно средств')

    return
  }

  walletStore.spend(action.amount ?? 0)

  const baseEffect: string | undefined = action.effect

  showGameResultModal(action.title, 'Операция выполнена', { baseEffect })
  toast.showSuccess('Операция выполнена')
}
</script>
