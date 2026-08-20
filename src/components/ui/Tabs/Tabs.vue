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
      <GameIcon class="tab__icon" :name="tabIconNames[item.icon] ?? 'bolt'" :size="20" />
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
import GameIcon from '@/components/ui/GameIcon/GameIcon.vue'
import type { GameIconName } from '@/components/ui/GameIcon/GameIcon.types'

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

const tabIconNames: Record<string, GameIconName> = {
  book: 'book',
  bolt: 'bolt',
  briefcase: 'briefcase',
  buildings: 'buildings',
  heart: 'heart',
  home: 'home',
  ladle: 'ladle',
  medal: 'medal',
  masks: 'masks',
  palette: 'palette',
  shop: 'shop',
  users: 'users',
}
</script>
