<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="command-palette__overlay"
        @click.self="close"
      />
    </Transition>
    <Transition name="fade-scale">
      <div
        v-if="isOpen"
        class="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Командная палитра"
      >
        <div class="command-palette__input-wrap">
          <span class="command-palette__icon" aria-hidden="true">
            <GameIcon name="search" :size="16" :stroke-width="1.5" />
          </span>
          <input
            ref="inputRef"
            v-model="query"
            class="command-palette__input"
            type="text"
            placeholder="Поиск разделов и действий..."
            autocomplete="off"
            spellcheck="false"
            @keydown="handleKeydown"
          >
          <kbd class="command-palette__hint">Esc</kbd>
        </div>

        <ul
          v-if="results.length > 0"
          class="command-palette__list"
        >
          <li
            v-for="(item, index) in results"
            :key="item.id"
            class="command-palette__item"
            :class="{ 'command-palette__item--active': index === activeIndex }"
            @mouseenter="activeIndex = index"
            @click="execute(item)"
          >
            <span class="command-palette__item-icon" aria-hidden="true">
              <GameIcon :name="item.icon" :size="16" :stroke-width="1.5" />
            </span>
            <span class="command-palette__item-label">{{ item.label }}</span>
            <span class="command-palette__item-group">{{ item.group }}</span>
          </li>
        </ul>
        <div
          v-else
          class="command-palette__empty"
        >
          Ничего не найдено
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import './CommandPalette.scss'
import { NAV_ITEMS, ROUTE_MAP } from '@/constants/navigation'
import type { CommandPaletteItem } from './CommandPalette.types'

const settings = useSettingsStore()

const { state, close } = useCommandPalette()

const settingsDrawer = useSettingsDrawer()

const isOpen = computed<boolean>(() => state.value.isOpen)
const query = ref<string>('')
const activeIndex = ref<number>(0)
const inputRef = ref<HTMLInputElement | null>(null)

const NAV_ICON_NAMES: Record<string, CommandPaletteItem['icon']> = {
  activityLog: 'journal',
  actions: 'bolt',
  education: 'book',
  finance: 'wallet',
  home: 'buildings',
  shop: 'shop',
  skills: 'medal',
  work: 'briefcase',
}

const commands = computed<CommandPaletteItem[]>(() => {
  const navCommands: CommandPaletteItem[] = NAV_ITEMS.map((item): CommandPaletteItem => {
    const route: string | undefined = ROUTE_MAP[item.id]

    return {
      id: `nav-${item.id}`,
      label: item.label,
      icon: NAV_ICON_NAMES[item.id] ?? 'bolt',
      group: 'Разделы',
      action: () => {
        if (route) navigateTo(route)
      },
    }
  })

  const homeCommand: CommandPaletteItem = {
    id: 'nav-home',
    label: 'Главная',
    icon: 'home',
    group: 'Разделы',
    action: () => navigateTo('/game'),
  }

  const actionCommands: CommandPaletteItem[] = [
    {
      id: 'action-toggle-theme',
      label: settings.isDark ? 'Светлая тема' : 'Тёмная тема',
      icon: settings.isDark ? 'sun-2' : 'moon',
      group: 'Действия',
      action: () => settings.toggleTheme(),
    },
    {
      id: 'action-open-settings',
      label: 'Открыть настройки',
      icon: 'settings',
      group: 'Действия',
      action: () => settingsDrawer.open(),
    },
    {
      id: 'action-replay-onboarding',
      label: 'Повторить онбординг',
      icon: 'play',
      group: 'Действия',
      action: () => settings.resetOnboarding(),
    },
  ]

  return [homeCommand, ...navCommands, ...actionCommands]
})

const results = computed<CommandPaletteItem[]>(() => {
  const q = query.value.trim().toLowerCase()

  if (!q) return commands.value

  return commands.value.filter((item) => {
    return item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
  })
})

watch(results, () => {
  activeIndex.value = 0
})

watch(isOpen, (value) => {
  if (value) {
    query.value = ''
    activeIndex.value = 0
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const item = results.value[activeIndex.value]

    if (item) execute(item)

    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

function execute(item: CommandPaletteItem): void {
  item.action()
  close()
}
</script>
