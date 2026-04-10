<template>
  <nav class="bottom-nav">
    <RoundedPanel :padding="'6px 8px'" :radius="18" :shadow="true">
      <div class="bottom-nav__items">
        <button
          v-for="item in items"
          :key="item.path"
          class="bottom-nav__item"
          :class="{ 'bottom-nav__item--active': currentPath === item.path }"
          @click="navigateTo(item.path)"
        >
          <span class="bottom-nav__icon">{{ item.icon }}</span>
          <span class="bottom-nav__label">{{ item.label }}</span>
        </button>
      </div>
    </RoundedPanel>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, navigateTo } from '#imports'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import './BottomNav.scss'

const route = useRoute()

const currentPath = computed(() => route.path)

const items = [
  { icon: '🏠', label: 'Главная', path: '/game' },
  { icon: '💼', label: 'Карьера', path: '/game/career' },
  { icon: '📚', label: 'Учёба', path: '/game/education' },
  { icon: '💰', label: 'Финансы', path: '/game/finance' },
  { icon: '🔍', label: 'Ещё', path: '/game/skills' },
]
</script>
