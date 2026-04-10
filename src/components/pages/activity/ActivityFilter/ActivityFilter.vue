<template>
  <div class="filter-row">
    <button
      v-for="f in filters"
      :key="f.type ?? 'all'"
      class="filter-btn"
      :class="{ active: modelValue === (f.type ?? 'all') }"
      @click="$emit('update:modelValue', f.type ?? 'all')"
    >
      {{ f.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const filters = [
  { label: 'Все', type: null },
  { label: 'Действия', type: 'action' },
  { label: 'События', type: 'event' },
  { label: 'Финансы', type: 'finance' },
  { label: 'Карьера', type: 'career' },
  { label: 'Обучение', type: 'education' },
  { label: 'Навыки', type: 'skill_change' },
  { label: 'Время', type: 'time' },
]
</script>

<style scoped lang="scss" src="./ActivityFilter.scss"></style>
