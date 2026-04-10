<template>
  <RoundedPanel>
    <h3 class="section-title">Действия</h3>
    <div class="action-list">
      <div v-for="action in financeActions" :key="action.id" class="action-card" @click="handleAction(action)">
        <div class="action-header">
          <span class="action-title">{{ action.title }}</span>
          <span class="action-amount">{{ formatMoney(action.amount) }} ₽</span>
        </div>
        <p class="action-desc">{{ action.description }}</p>
      </div>
    </div>
  </RoundedPanel>
</template>

<script setup lang="ts">
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import { useGameStore } from '@/stores/game.store'
import { useToast } from '@/composables/useToast'
import { LEGACY_FINANCE_SCENE_ACTIONS } from '@/domain/balance/constants/legacy-finance-scene-actions'
import type { LegacyFinanceAction } from '@/domain/balance/types'
import { formatMoney } from '@/utils/format'

const store = useGameStore()
const toast = useToast()

const financeActions = LEGACY_FINANCE_SCENE_ACTIONS

function handleAction(action: LegacyFinanceAction): void {
  if (!store.isInitialized) {
    toast.showError('Мир не инициализирован')
    return
  }
  const result = store.applyFinanceAction(action.id)
  if (result && !result.startsWith('Мир не')) {
    toast.showSuccess(result)
  } else {
    toast.showError(result || 'Не удалось выполнить действие')
  }
}
</script>

<style scoped lang="scss" src="./FinanceActionList.scss"></style>
