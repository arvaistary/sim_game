<template>
  <nav class="nav-wrapper">
    <div class="nav-grid">
      <button class="nav-item" @click="goHome">
        <span
          class="nav-dot"
          :class="{ 'nav-dot--active': isHomePage }"
        >🏠</span>
        <span class="nav-label">Дом</span>
      </button>
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        @click="handleNavClick(item)"
      >
        <span
          class="nav-dot"
          :class="{ 'nav-dot--active': item.id === activeItemId }"
        >{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { navigateTo, useRoute } from '#imports'
import { NAV_ITEMS, ROUTE_MAP } from '@/constants/navigation'
import './GameNav.scss'

const route = useRoute()
const navItems = NAV_ITEMS

const isHomePage = computed(() => route.path === '/game')

const activeItemId = computed(() => {
  const currentPath = route.path
  const activeItem = navItems.find((item) => ROUTE_MAP[item.id] === currentPath)
  return activeItem?.id ?? ''
})

function goHome(): void {
  navigateTo('/game')
}

function handleNavClick(item: { id: string }): void {
  const targetRoute = ROUTE_MAP[item.id]
  if (targetRoute) {
    navigateTo(targetRoute)
  }
}
</script>
