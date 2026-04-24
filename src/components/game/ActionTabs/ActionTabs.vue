<template>
  <div class="action-tabs">
    <button
      v-for="category in categories"
      :key="category.id"
      class="action-tab"
      :class="{ 'action-tab--active': activeCategory === category.id }"
      @click="$emit('update:activeCategory', category.id)"
    >
      <span class="action-tab__icon">{{ category.icon }}</span>
      <span class="action-tab__content">
        <span class="action-tab__title">{{ category.label }}</span>
        <span class="action-tab__desc">{{ category.subtitle }}</span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import './ActionTabs.scss'

import type { ActionCategory } from '@/constants/action-categories'

defineProps<{
  categories: ActionCategory[]
  activeCategory: string
}>()

defineEmits<{
  'update:activeCategory': [id: string]
}>()
</script>

