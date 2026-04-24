<template>
  <div class="industry-filter">
    <select
      class="industry-select"
      :value="activeIndustry"
      @change="$emit('update:activeIndustry', ($event.target as HTMLSelectElement).value)"
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

import type { Industry } from '@/constants/work-categories'

defineProps<{
  industries: Industry[]
  activeIndustry: string
}>()

defineEmits<{
  'update:activeIndustry': [id: string]
}>()
</script>

