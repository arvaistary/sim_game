<template>
  <Modal
    @close="handleClose"
    title="Рабочая смена"
    >
    <div
      v-if="workOptions"
      class="work-modal"
      >
      <p class="work-modal__line">
        <strong>Должность:</strong> {{ workOptions.jobName }}
      </p>
      <p class="work-modal__line">
        <strong>График:</strong> {{ workOptions.schedule }}
      </p>
      <p class="work-modal__line">
        <strong>Один рабочий день:</strong> {{ workOptions.dailyHours }} ч
      </p>
      <p class="work-modal__line">
        <strong>Норма недели:</strong> {{ workOptions.requiredHoursPerWeek }} ч
      </p>
      <p class="work-modal__line">
        <strong>Отработано:</strong> {{ workOptions.workedHoursCurrentWeek }} ч
      </p>
      <p class="work-modal__line">
        <strong>Осталось:</strong> {{ workOptions.remainingHoursCurrentWeek }} ч
      </p>
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
        @click="handleFullShift"
        color="var(--color-action-secondary)"
        />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import './WorkChoiceModal.scss'

import type { WorkChoiceModalProps } from './WorkChoiceModal.types'
/**
 * @prop {WorkOptions | null} workOptions - Доступные опции работы или null
 * @prop {boolean} isWorkInProgress - Флаг выполнения рабочей смены
 * @prop {boolean} canStartOneDayShift - Доступна ли однодневная смена
 * @prop {boolean} canStartFullShift - Доступна ли полная смена
 * @prop {(hours: number) => void} [onRunShift] - Callback запуска рабочей смены
 */
const props = defineProps<WorkChoiceModalProps>()

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
