<template>
  <NuxtPage />

  <Modal
    :is-open="isMenuOpen"
    title="Меню"
    max-width="440px"
    @close="handleCloseMenu"
  >
    <div class="escape-menu">
      <button
        v-for="menuItem in menuItems"
        :key="menuItem.id"
        class="escape-menu__item"
        :class="{ 'escape-menu__item--disabled': menuItem.disabled }"
        :disabled="menuItem.disabled"
        @click="handleMenuAction(menuItem.id)"
      >
        <span class="escape-menu__item-title">{{ menuItem.title }}</span>
        <span class="escape-menu__item-description">{{ menuItem.description }}</span>
      </button>

      <section class="escape-menu__theme">
        <div class="escape-menu__theme-copy">
          <h4 class="escape-menu__theme-title">Тема</h4>
          <p class="escape-menu__theme-description">
            {{ themeDescription }}
          </p>
        </div>

        <button
          class="theme-toggle"
          :class="{ 'theme-toggle--active': isDarkMode }"
          type="button"
          role="switch"
          :aria-checked="isDarkMode"
          :aria-label="themeToggleLabel"
          @click="handleToggleTheme"
        >
          <span class="theme-toggle__track">
            <span class="theme-toggle__thumb" />
          </span>
          <span class="theme-toggle__label">{{ themeLabel }}</span>
        </button>
      </section>
    </div>
  </Modal>

  <GameModalHost />
  <ModalStackHost />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { navigateTo, useColorMode, useRoute } from '#imports'
import { usePlayerStore } from '@/stores'
import { useGameStore } from '@/stores/game.store'
import { LocalStorageSaveRepository } from '@/infrastructure/persistence/LocalStorageSaveRepository'

import type { AppMenuActionId, AppMenuActionItem } from '@/app.types'

const route = useRoute()
const colorMode = useColorMode()
const playerStore = usePlayerStore()
const gameStore = useGameStore()
const saveRepository = new LocalStorageSaveRepository()

const isMenuOpen = ref<boolean>(false)

const menuItems: AppMenuActionItem[] = [
  {
    id: 'save',
    title: 'Сохранить',
    description: 'Скоро появится',
    disabled: true,
  },
  {
    id: 'load',
    title: 'Загрузить',
    description: 'Скоро появится',
    disabled: true,
  },
  {
    id: 'newGame',
    title: 'Новая игра',
    description: 'Сбросить текущее прохождение и вернуться на старт',
    disabled: false,
  },
]

const isDarkMode = computed<boolean>(() => colorMode.preference === 'dark')
const themeLabel = computed<string>(() => isDarkMode.value ? 'Тёмная' : 'Светлая')
const themeDescription = computed<string>(() => {
  return isDarkMode.value
    ? 'Сейчас включена тёмная тема'
    : 'Сейчас включена светлая тема'
})
const themeToggleLabel = computed<string>(() => {
  return isDarkMode.value
    ? 'Переключить на светлую тему'
    : 'Переключить на тёмную тему'
})

function handleCloseMenu(): void {
  isMenuOpen.value = false
}

function handleOpenMenu(): void {
  isMenuOpen.value = true
}

function handleToggleTheme(): void {
  colorMode.preference = isDarkMode.value ? 'light' : 'dark'
}

function handleMenuAction(actionId: AppMenuActionId): void {
  if (actionId === 'newGame') {
    playerStore.reset()
    handleCloseMenu()
    navigateTo('/')
  }
}

function handleGlobalKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return

  event.preventDefault()

  if (isMenuOpen.value) {
    handleCloseMenu()
    return
  }

  handleOpenMenu()
}

watch(() => route.fullPath, () => {
  handleCloseMenu()
})

function flushSaveToStorage(): void {
  if (playerStore.isInitialized) {
    const saveData = gameStore.save()
    saveRepository.save(saveData)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('beforeunload', flushSaveToStorage)
  window.addEventListener('pagehide', flushSaveToStorage)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('beforeunload', flushSaveToStorage)
  window.removeEventListener('pagehide', flushSaveToStorage)
})
</script>

<style scoped lang="scss">
.escape-menu {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.escape-menu__item {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  width: 100%;
  padding: $space-4;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast);

  &:hover:not(:disabled) {
    border-color: var(--color-action-primary);
    background: var(--color-bg-elevated);
    transform: translateY(-1px);
  }
}

.escape-menu__item--disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.escape-menu__item-title {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
}

.escape-menu__item-description {
  font-size: $font-size-xs;
  color: var(--color-text-secondary);
}

.escape-menu__theme {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-4;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
}

.escape-menu__theme-copy {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.escape-menu__theme-title {
  margin: 0;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
}

.escape-menu__theme-description {
  margin: 0;
  font-size: $font-size-xs;
  color: var(--color-text-secondary);
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
}

.theme-toggle__track {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 52px;
  height: 30px;
  padding: 3px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  transition: background-color var(--transition-fast);
}

.theme-toggle__thumb {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast);
}

.theme-toggle__label {
  min-width: 72px;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  text-align: left;
}

.theme-toggle--active .theme-toggle__track {
  background: var(--color-action-primary);
}

.theme-toggle--active .theme-toggle__thumb {
  transform: translateX(22px);
}

@media (max-width: $breakpoint-sm) {
  .escape-menu__theme {
    align-items: flex-start;
    flex-direction: column;
  }

  .theme-toggle {
    padding-left: 0;
  }
}
</style>
