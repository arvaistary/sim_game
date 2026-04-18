<template>
  <RoundedPanel>
    <h3 class="section-title">Действия</h3>
    <div v-if="financeActions.length > 0" class="action-list">
      <div v-for="action in financeActions" :key="action.id" class="action-card" @click="handleAction(action)">
        <div class="action-header">
          <span class="action-title">{{ action.title }}</span>
          <span class="action-amount">{{ formatMoney(action.amount) }} ₽</span>
        </div>
        <p class="action-desc">{{ action.description }}</p>
      </div>
    </div>
    <p v-else class="finance-empty">{{ financeEmptyHint }}</p>
  </RoundedPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RoundedPanel from '@/components/ui/RoundedPanel/index.vue'
import { useGameStore } from '@/stores/game.store'
import { showGameResultModal } from '@/composables/useGameModal'
import { useToast } from '@/composables/useToast'
import { useAgeRestrictions } from '@/composables/useAgeRestrictions'
import type { LegacyFinanceAction } from '@/domain/balance/types'
import { formatMoney } from '@/utils/format'

const store = useGameStore()
const toast = useToast()
const { ageGroupLabel } = useAgeRestrictions()

const financeEmptyHint = computed(
  () =>
    `Для этапа «${ageGroupLabel.value}» нет доступных финансовых операций. Раздел откроется с возраста, когда вкладка «Финансы» станет активной.`,
)

/** Единый source-of-truth: данные из FinanceActionSystem engine */
const financeActions = computed(() => {
  const actions = store.getFinanceActions() as Array<LegacyFinanceAction & { available?: boolean; reason?: string }>
  return actions.length > 0 ? actions : []
})

function handleAction(action: LegacyFinanceAction & { available?: boolean; reason?: string }): void {
  if (!store.isInitialized) {
    toast.showError('Мир не инициализирован')
    return
  }
  if (action.available === false) {
    toast.showError(action.reason || 'Действие недоступно')
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
