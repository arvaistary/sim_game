<template>
  <nav
    class="game-nav"
    :class="`game-nav--${mode}`"
  >
    <!-- Home button -->
    <button
      class="game-nav__item"
      :class="{ 'game-nav__item--active': isHomePage }"
      type="button"
      :title="mode === 'sidebar' ? 'Главная' : undefined"
      @click="goHome"
    >
      <GameIcon class="game-nav__icon" name="home" />
      <span v-if="mode === 'sidebar'" class="game-nav__label">Главная</span>
      <span v-else class="game-nav__label">Дом</span>
    </button>

    <template v-for="item in allNavItems" :key="item.id">
      <!-- Visible item -->
      <button
        v-if="item.visible"
        class="game-nav__item"
        :class="{ 'game-nav__item--active': item.id === activeItemId }"
        type="button"
        :title="mode === 'sidebar' ? item.label : undefined"
        @click="handleNavClick(item)"
      >
        <GameIcon class="game-nav__icon" :name="navIconNames[item.id] ?? 'bolt'" />
        <span class="game-nav__label">{{ item.label }}</span>
      </button>

      <!-- Locked item -->
      <button
        v-else
        class="game-nav__item game-nav__item--locked"
        type="button"
        :title="mode === 'sidebar' ? item.label : undefined"
        @click="handleLockedClick(item)"
      >
        <GameIcon class="game-nav__icon game-nav__icon--locked" name="lock" />
        <span class="game-nav__label game-nav__label--locked">{{ item.label }}</span>
      </button>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { NAV_ITEMS, ROUTE_MAP } from '@/constants/navigation'
import type { GameIconName } from '@/constants/game-icons.types'
import type { NavItemIdRef, NavItemWithState } from './GameNav.types'
import './GameNav.scss'

interface GameNavProps {
  mode?: 'sidebar' | 'bottom'
}

withDefaults(defineProps<GameNavProps>(), {
  mode: 'sidebar',
})

const route = useRoute()
const navItems = NAV_ITEMS
const { isTabVisible, age } = useAgeRestrictions()
const toast = useToast()

const allNavItems = computed<NavItemWithState[]>(() =>
  navItems.map((item) => ({
    id: item.id,
    label: item.label,
    visible: isTabVisible(item.id),
    unlockAge: TAB_UNLOCK_AGE[item.id] ?? null,
  })),
)

const navIconNames: Record<string, GameIconName> = {
  activityLog: 'journal',
  actions: 'bolt',
  education: 'book',
  finance: 'wallet',
  home: 'buildings',
  shop: 'shop',
  skills: 'medal',
  work: 'briefcase',
}

const isHomePage = computed<boolean>(() => route.path === '/game')

const activeItemId = computed<string>(() => {
  const currentPath = route.path
  const activeItem = navItems.find(
    (item) => ROUTE_MAP[item.id] === currentPath)
  return activeItem?.id ?? ''
})

function goHome(): void {
  navigateTo('/game')
}

function handleNavClick(item: NavItemIdRef): void {
  const targetRoute = ROUTE_MAP[item.id]

  if (targetRoute) {
    navigateTo(targetRoute)
  }
}

function handleLockedClick(item: NavItemWithState): void {
  const currentAge = age.value

  if (item.unlockAge !== null && item.unlockAge > currentAge) {
    toast.showInfo(`${item.label} станет доступно в ${item.unlockAge} лет. Подрастите ещё немного!`)
  } else {
    toast.showInfo(`${item.label} пока недоступно. Подрастите ещё немного!`)
  }
}
</script>
