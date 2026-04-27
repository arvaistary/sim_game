<template>
  <div class="industry-filter">
    <select
      :value="activeIndustry"
      @change="$emit('update:activeIndustry', ($event.target as HTMLSelectElement).value)"
      class="industry-select"
      >
      <option
        v-for="industry in industries"
        :key="industry.id"
        :value="industry.id"
      >
        {{ industry.icon }} {{ industry.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import './IndustryFilter.scss'

import type { Industry } from '@constants/work-categories.types'

/**
 * @prop {Industry[]} industries - Список отраслей для фильтра
 * @prop {string} activeIndustry - Идентификатор выбранной отрасли
 */
defineProps<{
  industries: Industry[]
  activeIndustry: string
}>()

defineEmits<{
  'update:activeIndustry': [id: string]
}>()
</script>

