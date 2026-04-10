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

const route = useRoute()

const currentPath = computed(() => route.path)

const items = [
  { icon: '🏠', label: 'Главная', path: '/game' },
  { icon: '💼', label: 'Карьера', path: '/game/career' },
  { icon: '📚', label: 'Учёба', path: '/game/education' },
  { icon: '💰', label: 'Финансы', path: '/game/finance' },
  { icon: 'в°', label: 'Ещё', path: '/game/skills' },
]
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 12px 12px;
  max-width: 480px;
  margin: 0 auto;
  z-index: 100;
}

.bottom-nav__items {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--radius-small);
  transition: background-color var(--transition-fast);
}

.bottom-nav__item:hover {
  background-color: var(--color-neutral);
}

.bottom-nav__item--active {
  background-color: var(--color-accent-soft);
}

.bottom-nav__icon {
  font-size: 20px;
}

.bottom-nav__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text);
}
</style>

