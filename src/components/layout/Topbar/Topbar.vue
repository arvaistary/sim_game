<template>
  <div class="topbar">
    <!-- Left: page title / slot -->
    <div class="topbar__left">
      <slot name="title">
        <h1 v-if="title" class="topbar__title">{{ title }}</h1>
      </slot>
    </div>

    <!-- Right: actions -->
    <div class="topbar__right">
      <div v-if="playerName" class="topbar__profile">
        <span class="topbar__avatar">{{ initials }}</span>
        <span class="topbar__profile-name">{{ playerName }}</span>
      </div>

      <button
        class="topbar__cmd"
        type="button"
        title="Открыть командную палитру (Ctrl+K)"
        @click="handleOpenPalette"
      >
        <span class="topbar__cmd-hint">Ctrl K</span>
        <GameIcon name="search" :size="14" />
      </button>

      <button
        class="topbar-theme"
        :class="{ 'topbar-theme--dark': isDarkMode }"
        type="button"
        role="switch"
        :aria-checked="isDarkMode"
        :aria-label="themeToggleLabel"
        :title="themeToggleLabel"
        @click="handleToggleTheme"
      >
        <span class="topbar-theme__knob" aria-hidden="true">
          <GameIcon :name="isDarkMode ? 'moon' : 'sun-2'" :size="12" :stroke-width="1.5" />
        </span>
      </button>

      <button
        class="topbar__settings"
        type="button"
        title="Настройки"
        aria-label="Открыть настройки"
        @click="handleOpenSettings"
      >
        <GameIcon name="settings" :size="18" :stroke-width="1.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import './Topbar.scss'

interface TopbarProps {
  title?: string
}

withDefaults(defineProps<TopbarProps>(), {
  title: '',
})

const colorMode = useColorMode()

const playerStore = usePlayerStore()

const settingsDrawer = useSettingsDrawer()
const commandPalette = useCommandPalette()

const playerName = computed<string>(() => playerStore.name)
const initials = computed<string>(() => {
  const name: string = playerName.value.trim()
  if (!name) return ''
  return name.charAt(0).toUpperCase()
})

const isDarkMode = computed<boolean>(() => colorMode.value === 'dark')
const themeToggleLabel = computed<string>(() => {
  return isDarkMode.value
    ? 'Переключить на светлую тему'
    : 'Переключить на тёмную тему'
})

function handleToggleTheme(): void {
  colorMode.preference = isDarkMode.value ? 'light' : 'dark'
}

function handleOpenSettings(): void {
  settingsDrawer.open()
}

function handleOpenPalette(): void {
  commandPalette.open()
}

</script>
