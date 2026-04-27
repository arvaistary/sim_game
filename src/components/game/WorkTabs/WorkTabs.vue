<template>
  <div class="work-tabs">
    <button
      v-for="type in types"
      :key="type.id"
      :class="{ 'work-tab--active': activeType === type.id }"
      @click="$emit('update:activeType', type.id)"
      class="work-tab"
      >
      <span class="work-tab__icon">
        {{ type.icon }}
      </span>
      <span class="work-tab__content">
        <span class="work-tab__title">
          {{ type.label }}
        </span>
        <span class="work-tab__desc">
          {{ type.subtitle }}
        </span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import './WorkTabs.scss'

import type { WorkType } from '@constants/work-categories.types'

/**
 * @prop {WorkType[]} types - Список типов занятости для табов
 * @prop {string} activeType - Идентификатор активного типа занятости
 */
defineProps<{
  types: WorkType[]
  activeType: string
}>()

defineEmits<{
  'update:activeType': [id: string]
}>()
</script>
