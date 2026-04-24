<template>
  <nav class="nav-wrapper">
    <div class="nav-grid">
      <button
        class="nav-item"
        @click="goHome"
      >
        <span
          class="nav-dot"
          :class="{ 'nav-dot--active': isHomePage }"
        >🏠</span>
        <span class="nav-label">Дом</span>
      </button>
      <template v-for="item in allNavItems" :key="item.id">
        <!-- Доступная вкладка -->
        <button
          v-if="item.visible"
          class="nav-item"
          @click="handleNavClick(item)"
        >
          <span
            class="nav-dot"
            :class="{ 'nav-dot--active': item.id === activeItemId }"
          >{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </button>
        <!-- Заблокированная вкладка -->
        <button
          v-else
          class="nav-item nav-item--locked"
          @click="handleLockedClick(item)"
        >
          <span class="nav-dot nav-dot--locked">🔒</span>
          <span class="nav-label nav-label--locked">{{ item.label }}</span>
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import './GameNav.scss'

import { NAV_ITEMS, ROUTE_MAP } from '@/constants/navigation'

interface NavItemWithState {
  id: string
  icon: string
  label: string
  visible: boolean
  unlockAge: number | null
}

const route = useRoute()
const navItems = NAV_ITEMS
const { isTabVisible, age } = useAgeRestrictions()
const toast = useToast()

const allNavItems = computed<NavItemWithState[]>(() =>
  navItems.map(item => ({
    id: item.id,
    icon: item.icon,
    label: item.label,
    visible: isTabVisible(item.id),
    unlockAge: TAB_UNLOCK_AGE[item.id] ?? null,
  }))
)

const isHomePage = computed(() => route.path === '/game')

const activeItemId = computed(() => {
  const currentPath = route.path
  const activeItem = navItems.find(
    (item) => ROUTE_MAP[item.id] === currentPath)

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

function handleLockedClick(item: NavItemWithState): void {
  const currentAge = age.value
  if (item.unlockAge !== null && item.unlockAge > currentAge) {
    toast.showInfo(`🔒 ${item.label} станет доступно в ${item.unlockAge} лет. Подрастите ещё немного!`)
  } else {
    toast.showInfo(`🔒 ${item.label} пока недоступно. Подрастите ещё немного!`)
  }
}
</script>
