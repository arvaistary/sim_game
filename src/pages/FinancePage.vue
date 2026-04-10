<template>
  <GameLayout title="Финансы">
    <div class="finance-page">
      <!-- Баланс -->
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

      <!-- Расходы -->
      <RoundedPanel>
        <h3 class="section-title">Ежемесячные расходы</h3>
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

      <!-- Финансовые действия -->
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
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GameLayout from '@/components/layout/GameLayout.vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import { useGameStore } from '@/stores/game.store'
import { useToast } from '@/composables/useToast'
import { LEGACY_FINANCE_SCENE_ACTIONS } from '@/domain/balance/legacy-finance-scene-actions'
import type { LegacyFinanceAction } from '@/domain/balance/types'

const store = useGameStore()
const toast = useToast()

const reserveFund = computed(() => {
  const wallet = store.wallet as unknown as Record<string, unknown> | null
  return (wallet?.reserveFund as number) ?? 0
})

const monthlyExpenses = computed(() => {
  const snapshot = store.getFinanceSnapshot() as Record<string, unknown> | null
  return (snapshot?.monthlyExpenses as Record<string, number>) ?? {}
})

const totalExpenses = computed(() => {
  return Object.values(monthlyExpenses.value).reduce((sum, v) => sum + v, 0)
})

const expenseLabels: Record<string, string> = {
  housing: 'Жильё',
  food: 'Еда',
  transport: 'Транспорт',
  leisure: 'Досуг',
  education: 'Образование',
}

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

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}
</script>

<style scoped>
.finance-page{display:flex;flex-direction:column;gap:12px}
.balance-row{display:flex;justify-content:space-between;gap:16px}
.balance-item{display:flex;flex-direction:column;align-items:center;flex:1}
.balance-label{font-size:12px;color:var(--color-text);opacity:.6}
.balance-value{font-size:18px;font-weight:700;color:var(--color-accent)}
.balance-value.reserve{color:var(--color-sage)}
.section-title{font-size:15px;font-weight:700;margin:0 0 8px}
.expense-list{display:flex;flex-direction:column;gap:4px}
.expense-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}
.expense-row.total{border-top:1px solid rgba(0,0,0,.1);margin-top:4px;padding-top:8px;font-weight:700}
.expense-name{color:var(--color-text);opacity:.7}
.expense-value{font-weight:600}
.action-list{display:flex;flex-direction:column;gap:8px}
.action-card{padding:10px;border-radius:12px;background:rgba(0,0,0,.03);cursor:pointer;transition:all .2s}
.action-card:hover{background:rgba(232,180,160,.1)}
.action-header{display:flex;justify-content:space-between;margin-bottom:4px}
.action-title{font-size:13px;font-weight:600}
.action-amount{font-size:13px;font-weight:700;color:var(--color-accent)}
.action-desc{font-size:11px;color:var(--color-text);opacity:.6}
</style>

