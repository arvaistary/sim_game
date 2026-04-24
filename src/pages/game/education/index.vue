<template>
  <GameLayout title="Образование">
    <div class="education-page">
      <!-- Табы-переключатели категорий -->
      <div class="edu-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="edu-tab"
          :class="{ 'edu-tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="edu-tab__icon">{{ tab.icon }}</span>
          <span class="edu-tab__content">
            <span class="edu-tab__title">{{ tab.title }}</span>
            <span class="edu-tab__desc">{{ tab.shortDesc }}</span>
          </span>
        </button>
      </div>

      <!-- Контент: Программы обучения -->
      <template v-if="activeTab === 'programs'">
        <EducationLevel />
        <ProgramList />
      </template>

      <!-- Контент: Учёба и навыки -->
      <template v-if="activeTab === 'study'">
        <ActionCardList
          :actions="sortedStudyActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="(a: any) => !canExecute(a.id)"
          :get-disabled-reason="getDisabledReason"
          @execute="executeAction"
        />
      </template>

      <!-- Контент: Практика и привычки -->
      <template v-if="activeTab === 'practice'">
        <ActionCardList
          :actions="sortedPracticeActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="(a: any) => !canExecute(a.id)"
          :get-disabled-reason="getDisabledReason"
          @execute="executeAction"
        />
      </template>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { PRACTICE_ACTION_IDS } from '@/config/education-tab-groups'

definePageMeta({ middleware: 'game-init' })

const tabs = [
  { id: 'programs', icon: '🎓', title: 'Программы', shortDesc: 'Курсы и программы обучения' },
  { id: 'study', icon: '📚', title: 'Учёба и навыки', shortDesc: 'Формальное обучение и развитие профессиональных навыков' },
  { id: 'practice', icon: '🧘', title: 'Практика и привычки', shortDesc: 'Лёгкие действия для регулярного саморазвития' },
] as const

const route = useRoute()
const availableTabIds = tabs.map(tab => tab.id)

function normalizeTab(rawValue: unknown): string {
  const value = typeof rawValue === 'string' ? rawValue : ''
  return availableTabIds.includes(value as (typeof tabs)[number]['id']) ? value : 'programs'
}

const activeTab = ref<string>(normalizeTab(route.query.tab))

watch(
  () => route.query.tab,
  (nextTab) => {
    activeTab.value = normalizeTab(nextTab)
  },
)

const store = useGameStore()
const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()

const educationActions = getActionsByCategory('education') as any
const selfdevActions = getActionsByCategory('selfdev') as any

/** Сортировка: доступные действия первыми */
function sortByAvailability(actions: any[]): any[] {
  return [...actions].sort((a, b) => {
    const aOk = canExecute(a.id) ? 0 : 1
    const bOk = canExecute(b.id) ? 0 : 1
    return aOk - bOk
  })
}

/** Получить причину недоступности действия */
function getDisabledReason(action: any): string {
  const result = store.canExecuteAction(action.id)
  return result.reason ?? 'Действие недоступно'
}

// Учёба и навыки: education БЕЗ practice-действий
const studyActions = computed(() => {
  void store.worldTick
  return educationActions.filter((a: any) => !PRACTICE_ACTION_IDS.has(a.id))
})

// Практика и привычки: practice из education + все selfdev
const practiceActions = computed(() => {
  void store.worldTick
  return [
    ...educationActions.filter((a: any) => PRACTICE_ACTION_IDS.has(a.id)),
    ...selfdevActions,
  ]
})

const sortedStudyActions = computed(() => sortByAvailability(studyActions.value))
const sortedPracticeActions = computed(() => sortByAvailability(practiceActions.value))
</script>

<style scoped lang="scss">
@use '@/assets/scss/mixins.scss' as *;

.education-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edu-tabs {
  display: flex;
  gap: $space-2;
}

.edu-tab {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3 $space-3;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl, 16px);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-card);
  text-align: left;

  &:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  &--active {
    background: var(--color-accent);
    border-color: var(--color-accent);

    .edu-tab__title {
      color: var(--color-text-on-accent);
    }

    .edu-tab__desc {
      color: rgba(255, 255, 255, 0.8);
    }

    .edu-tab__icon {
      filter: brightness(0) invert(1);
    }

    &:hover {
      background: var(--color-accent);
      border-color: var(--color-accent);
    }
  }
}

.edu-tab__icon {
  font-size: $font-size-lg;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.edu-tab__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.edu-tab__title {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.edu-tab__desc {
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

// Mobile: show only icons
@include mobile {
  .edu-tab {
    justify-content: center;
    align-items: center;
    padding: $space-3 $space-2;
  }

  .edu-tab__content {
    display: none;
  }

  .edu-tab__icon {
    margin-top: 0;
    font-size: $font-size-xl;
  }
}
</style>
