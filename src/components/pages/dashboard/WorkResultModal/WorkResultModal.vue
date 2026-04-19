<template>
  <Modal
    title="Итоги смены"
    @close="handleClose"
  >
    <p class="work-modal__result">{{ workSummary }}</p>
    <div v-if="statDiffs.length > 0" class="work-modal__stats">
      <p class="work-modal__stats-title">Изменения характеристик:</p>
      <ul class="work-modal__stats-list">
        <li v-for="diff in statDiffs" :key="diff.key" class="work-modal__stats-item">
          <span>{{ diff.label }}</span>
          <span :class="getDeltaClass(diff.delta)">
            {{ formatDelta(diff.delta) }}
          </span>
        </li>
      </ul>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import type { WorkStatDiff } from '../WorkButton/WorkButton.types'
import type { BaseModalProps } from '@/composables/useGameModal/modal.types'

interface Props extends BaseModalProps {
  workSummary: string
  statDiffs: WorkStatDiff[]
}

const props = defineProps<Props>()

function handleClose() {
  // Вызываем onClose, если он передан
  props.onClose?.()
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`
}

function getDeltaClass(delta: number): string {
  return delta >= 0 ? 'work-modal__delta--positive' : 'work-modal__delta--negative'
}
</script>

<style scoped lang="scss">
.work-modal__result {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary);
}

.work-modal__stats {
  margin-top: 12px;
}

.work-modal__stats-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.work-modal__stats-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.work-modal__stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--color-bg-elevated);
  font-size: 13px;
}

.work-modal__delta--positive {
  color: var(--color-status-success);
  font-weight: 600;
}

.work-modal__delta--negative {
  color: var(--color-status-danger);
  font-weight: 600;
}
</style>
