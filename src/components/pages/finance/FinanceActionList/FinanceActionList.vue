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
import { computed, ref } from 'vue'
import { useWalletStore, useFinanceStore } from '@/stores'
import { showGameResultModal } from '@/composables/useGameModal'
import { useToast } from '@/composables/useToast'
import { useAgeRestrictions } from '@/composables/useAgeRestrictions'
import type { LegacyFinanceAction } from '@/domain/balance/types'
import { formatMoney } from '@/utils/format'

const walletStore = useWalletStore()
const financeStore = useFinanceStore()
const toast = useToast()
const { ageGroupLabel } = useAgeRestrictions()

const isInitialized = ref(true) // Всегда true так как используем новые stores

const financeEmptyHint = computed(
  () =>
    `Для этапа «${ageGroupLabel.value}» нет доступных финансовых операций. Раздел откроется с возраста, когда вкладка «Финансы» станет активной.`,
)

const financeActions = computed(() => {
  void financeStore.totalExpense
  // Здесь можно использовать financeStore для получения действий
  // Пока возвращаем пустой массив - нужно добавить данные
  return [] as Array<LegacyFinanceAction & { available?: boolean; reason?: string }>
})

function handleAction(action: LegacyFinanceAction & { available?: boolean; reason?: string }): void {
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
  const baseEffect = (action as unknown as { effect?: string }).effect
  showGameResultModal(action.title, 'Операция выполнена', { baseEffect })
  toast.showSuccess('Операция выполнена')
}
</script>

const financeEmptyHint = computed(
  () =>
    `Для этапа «${ageGroupLabel.value}» нет доступных финансовых операций. Раздел откроется с возраста, когда вкладка «Финансы» станет активной.`,
)

/** Единый source-of-truth: данные из finance-store */
const financeActions = computed(() => {
  void store.worldTick
  void financeStore.totalExpense
  const actions = store.getFinanceActions() as Array<LegacyFinanceAction & { available?: boolean; reason?: string }>
  return actions.length > 0 ? actions : []
})

function handleAction(action: LegacyFinanceAction & { available?: boolean; reason?: string }): void {
  if (action.available === false) {
    toast.showError(action.reason || 'Действие недоступно')
    return
  }
  if (!store.isInitialized) {
    toast.showError('Мир не инициализирован')
    return
  }
  const result = store.applyFinanceAction(action.id)
  if (result && !result.startsWith('Мир не')) {
    const baseEffect = (action as unknown as { effect?: string }).effect
    showGameResultModal(action.title, result, { baseEffect })
  } else {
    toast.showError(result || 'Не удалось выполнить действие')
  }
}
</script>

<style scoped lang="scss" src="./FinanceActionList.scss"></style>
