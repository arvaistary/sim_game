<template>
  <Modal
    title="Рабочая смена"
    @close="handleClose"
  >
    <div v-if="workOptions" class="work-modal">
      <p class="work-modal__line"><strong>Должность:</strong> {{ workOptions.jobName }}</p>
      <p class="work-modal__line"><strong>График:</strong> {{ workOptions.schedule }}</p>
      <p class="work-modal__line"><strong>Один рабочий день:</strong> {{ workOptions.dailyHours }} ч</p>
      <p class="work-modal__line"><strong>Норма недели:</strong> {{ workOptions.requiredHoursPerWeek }} ч</p>
      <p class="work-modal__line"><strong>Отработано:</strong> {{ workOptions.workedHoursCurrentWeek }} ч</p>
      <p class="work-modal__line"><strong>Осталось:</strong> {{ workOptions.remainingHoursCurrentWeek }} ч</p>
    </div>

    <template #actions>
      <GameButton
        :disabled="isWorkInProgress || !canStartOneDayShift"
        :label="`1 день (${workOptions?.oneDayHours ?? 0} ч)`"
        @click="handleOneDayShift"
      />
      <GameButton
        :disabled="isWorkInProgress || !canStartFullShift"
        :label="`Вся смена (${workOptions?.fullShiftHours ?? 0} ч)`"
        color="var(--color-action-secondary)"
        @click="handleFullShift"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import type { WorkOptions } from '../WorkButton/WorkButton.types'

interface Props {
  workOptions: WorkOptions | null
  isWorkInProgress: boolean
  canStartOneDayShift: boolean
  canStartFullShift: boolean
  onRunShift?: (hours: number) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

function handleClose() {
  emit('close')
}

function handleOneDayShift() {
  props.onRunShift?.(props.workOptions?.oneDayHours ?? 0)
}

function handleFullShift() {
  props.onRunShift?.(props.workOptions?.fullShiftHours ?? 0)
}
</script>

<style scoped lang="scss">
.work-modal {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.work-modal__line {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary);
}
</style>
