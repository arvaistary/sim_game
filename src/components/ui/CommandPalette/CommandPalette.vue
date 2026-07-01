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
          <span class="command-palette__icon">⌕</span>
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
            <span class="command-palette__item-icon">{{ item.icon }}</span>
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

interface CommandItem {
  id: string
  label: string
  icon: string
  group: string
  action: () => void
}

const { state, close } = useCommandPalette()
const settings = useSettingsStore()
const settingsDrawer = useSettingsDrawer()

const isOpen = computed<boolean>(() => state.value.isOpen)
const query = ref<string>('')
const activeIndex = ref<number>(0)
const inputRef = ref<HTMLInputElement | null>(null)

const commands = computed<CommandItem[]>(() => {
  const navCommands: CommandItem[] = NAV_ITEMS.map((item) => {
    const route: string | undefined = ROUTE_MAP[item.id]
    return {
      id: `nav-${item.id}`,
      label: item.label,
      icon: item.icon,
      group: 'Разделы',
      action: () => {
        if (route) navigateTo(route)
      },
    }
  })

  const homeCommand: CommandItem = {
    id: 'nav-home',
    label: 'Главная',
    icon: '🏠',
    group: 'Разделы',
    action: () => navigateTo('/game'),
  }

  const actionCommands: CommandItem[] = [
    {
      id: 'action-toggle-theme',
      label: settings.isDark ? 'Светлая тема' : 'Тёмная тема',
      icon: settings.isDark ? '☀' : '☾',
      group: 'Действия',
      action: () => settings.toggleTheme(),
    },
    {
      id: 'action-open-settings',
      label: 'Открыть настройки',
      icon: '⚙',
      group: 'Действия',
      action: () => settingsDrawer.open(),
    },
    {
      id: 'action-replay-onboarding',
      label: 'Повторить онбординг',
      icon: '?',
      group: 'Действия',
      action: () => settings.resetOnboarding(),
    },
  ]

  return [homeCommand, ...navCommands, ...actionCommands]
})

const results = computed<CommandItem[]>(() => {
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

function execute(item: CommandItem): void {
  item.action()
  close()
}
</script>
