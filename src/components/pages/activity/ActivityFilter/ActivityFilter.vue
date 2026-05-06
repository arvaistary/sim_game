<template>
  <div class="filter-row">
    <button
      v-for="f in ACTIVITY_FILTERS"
      :key="f.type ?? 'all'"
      :class="{ active: modelValue === (f.type ?? 'all') }"
      @click="$emit('update:modelValue', f.type ?? 'all')"
      class="filter-btn"
      >
      {{ f.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import './ActivityFilter.scss'

import { ACTIVITY_FILTERS } from './ActivityFilter.constants'
/**
 * @prop {string} modelValue - Текущее значение фильтра (v-model)
 */
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
