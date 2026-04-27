<template>
  <GameLayout title="Образование">
    <div class="education-page">
      <!-- Табы-переключатели категорий -->
      <div class="edu-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ 'edu-tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
          class="edu-tab"
        >
          <span class="edu-tab__icon">
            {{ tab.icon }}
          </span>
          <span class="edu-tab__content">
            <span class="edu-tab__title">
              {{ tab.title }}
            </span>
            <span class="edu-tab__desc">
              {{ tab.shortDesc }}
            </span>
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
import './index.scss'

import { PRACTICE_ACTION_IDS } from '@constants/education-tab-groups'
import type { BalanceAction } from '@domain/balance/actions'
import type { CanExecuteActionResult } from '@stores/game-store'
import { tabs } from './index.constants'

definePageMeta({ middleware: 'game-init' })

const route = useRoute()

const store = useGameStore()

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()

const availableTabIds: string[] = tabs.map(tab => tab.id)
const educationActions: BalanceAction[] = getActionsByCategory('education')
const selfdevActions: BalanceAction[] = getActionsByCategory('selfdev')

const activeTab = ref<string>(normalizeTab(route.query.tab))

/** Учёба и навыки: education БЕЗ practice-действий */
const studyActions = computed<BalanceAction[]>(() => {
  void store.worldTick

  return educationActions.filter((a: BalanceAction) => !PRACTICE_ACTION_IDS.has(a.id))
})

/** Практика и привычки: practice из education + все selfdev */
const practiceActions = computed<BalanceAction[]>(() => {
  void store.worldTick

  return [
    ...educationActions.filter((a: BalanceAction) => PRACTICE_ACTION_IDS.has(a.id)),
    ...selfdevActions,
  ]
})

const sortedStudyActions = computed<BalanceAction[]>(() => sortByAvailability(studyActions.value))
const sortedPracticeActions = computed<BalanceAction[]>(() => sortByAvailability(practiceActions.value))

function normalizeTab(rawValue: unknown): string {
  const value: string = typeof rawValue === 'string' ? rawValue : ''

  return availableTabIds.includes(value as (typeof tabs)[number]['id']) ? value : 'programs'
}

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

watch(
  () => route.query.tab,
  (nextTab) => {
    activeTab.value = normalizeTab(nextTab)
  },
)
</script>
