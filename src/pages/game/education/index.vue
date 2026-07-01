<template>
  <GameLayout title="Образование">
    <div class="education-page">
      <!-- Табы-переключатели категорий -->
      <Tabs
        v-model="activeTab"
        :items="tabItems"
      />

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
        :is-disabled="(a: BalanceAction) => !canExecute(a.id)"
        :get-disabled-reason="getDisabledReason"
        @execute="executeAction"
      />
    </template>

    <!-- Контент: Практика и привычки -->
    <template v-if="activeTab === 'practice'">
      <ActionCardList
        :actions="sortedPracticeActions"
        :empty-text="actionsEmptyHint"
        :is-disabled="(a: BalanceAction) => !canExecute(a.id)"
        :get-disabled-reason="getDisabledReason"
        @execute="executeAction"
      />
      </template>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import './education.scss'
import { PRACTICE_ACTION_IDS } from '@/config/education-tab-groups'
import type { BalanceAction } from '@/domain/balance/actions'
import type { CanExecuteActionResult } from '@/stores/game.store.types'

definePageMeta({ middleware: 'game-init' })

const tabs = [
  { id: 'programs', icon: '🎓', title: 'Программы', shortDesc: 'Курсы и программы обучения' },
  { id: 'study', icon: '📚', title: 'Учёба и навыки', shortDesc: 'Формальное обучение и развитие профессиональных навыков' },
  { id: 'practice', icon: '🧘', title: 'Практика и привычки', shortDesc: 'Лёгкие действия для регулярного саморазвития' },
] as const

// Map tabs to Tabs.vue API
const tabItems = computed(() => tabs.map(t => ({
  id: t.id,
  icon: t.icon,
  label: t.title,
  subtitle: t.shortDesc,
})))

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

const educationActions: BalanceAction[] = getActionsByCategory('education')
const selfdevActions: BalanceAction[] = getActionsByCategory('selfdev')

/** Сортировка: доступные действия первыми */
function sortByAvailability(actions: BalanceAction[]): BalanceAction[] {
  return [...actions].sort((a, b) => {
    const aOk: number = canExecute(a.id) ? 0 : 1
    const bOk: number = canExecute(b.id) ? 0 : 1
    return aOk - bOk
  })
}

/** Получить причину недоступности действия */
function getDisabledReason(action: BalanceAction): string {
  const result: CanExecuteActionResult = store.canExecuteAction(action.id)
  return result.reason ?? 'Действие недоступно'
}

// Учёба и навыки: education БЕЗ practice-действий
const studyActions = computed(() => {
  void store.worldTick
  return educationActions.filter((a: BalanceAction) => !PRACTICE_ACTION_IDS.has(a.id))
})

// Практика и привычки: practice из education + все selfdev
const practiceActions = computed(() => {
  void store.worldTick
  return [
    ...educationActions.filter((a: BalanceAction) => PRACTICE_ACTION_IDS.has(a.id)),
    ...selfdevActions,
  ]
})

const sortedStudyActions = computed(() => sortByAvailability(studyActions.value))
const sortedPracticeActions = computed(() => sortByAvailability(practiceActions.value))
</script>
