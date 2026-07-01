<template>
  <div class="tabs">
    <button
      v-for="item in items"
      :key="item.id"
      class="tab"
      :class="{ 'tab--active': modelValue === item.id }"
      type="button"
      @click="$emit('update:modelValue', item.id)"
    >
      <span class="tab__icon">{{ item.icon }}</span>
      <span class="tab__content">
        <span class="tab__title">{{ item.label }}</span>
        <span
          v-if="item.subtitle"
          class="tab__desc"
        >{{ item.subtitle }}</span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import './Tabs.scss'

interface TabItem {
  id: string
  icon: string
  label: string
  subtitle?: string
}

interface TabsProps {
  items: TabItem[]
  modelValue: string
}

defineProps<TabsProps>()

defineEmits<{
  'update:modelValue': [id: string]
}>()
</script>
