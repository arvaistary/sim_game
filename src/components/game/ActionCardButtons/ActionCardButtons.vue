<template>
  <div class="action-card-buttons" :class="{ 'action-card-buttons--single': !showCalendar }">
    <button
      v-if="showCalendar"
      class="action-card-buttons__calendar"
      type="button"
      aria-label="Добавить в календарь"
      @click.stop="emit('calendar')"
    >
      <span aria-hidden="true">+</span>
      <GameIcon name="calendar" :size="20" />
    </button>
    <button
      class="action-card-buttons__execute"
      type="button"
      aria-label="Выполнить действие"
      :disabled="disabled"
      @click.stop="emit('execute')"
    >
      <GameIcon name="play" :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import './ActionCardButtons.scss'
import type { ActionCardButtonsEmits, ActionCardButtonsProps } from './ActionCardButtons.types'

withDefaults(defineProps<ActionCardButtonsProps>(), {
  disabled: false,
  showCalendar: true,
})

const emit = defineEmits<ActionCardButtonsEmits>()
</script>
