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
          <span class="edu-tab__label">{{ tab.title }}</span>
        </button>
      </div>

      <!-- Описание активной категории -->
      <p class="edu-tab-description">{{ activeTabDescription }}</p>

      <!-- Контент: Программы обучения -->
      <template v-if="activeTab === 'programs'">
        <EducationLevel />
        <ProgramList />
      </template>

      <!-- Контент: Учебные занятия -->
      <template v-if="activeTab === 'lessons'">
        <ActionCardList
          :actions="educationActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="(a: any) => !canExecute(a.id)"
          @execute="executeAction"
        />
      </template>

      <!-- Контент: Саморазвитие -->
      <template v-if="activeTab === 'selfdev'">
        <ActionCardList
          :actions="selfdevActions"
          :empty-text="actionsEmptyHint"
          :is-disabled="(a: any) => !canExecute(a.id)"
          @execute="executeAction"
        />
      </template>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { definePageMeta } from '#imports'
import GameLayout from '@/components/layout/GameLayout/GameLayout.vue'
import ActionCardList from '@/components/game/ActionCardList/ActionCardList.vue'
import EducationLevel from '@/components/pages/education/EducationLevel/EducationLevel.vue'
import ProgramList from '@/components/pages/education/ProgramList/ProgramList.vue'
import { useActions } from '@/composables/useActions'

definePageMeta({ middleware: 'game-init' })

const tabs = [
  { id: 'programs', icon: '🎓', title: 'Программы обучения', description: 'Долгосрочные курсы и образовательные программы для получения профессии и квалификации' },
  { id: 'lessons', icon: '📖', title: 'Учебные занятия', description: 'Повседневные действия для развития навыков и получения знаний' },
  { id: 'selfdev', icon: '🌱', title: 'Саморазвитие', description: 'Личностный рост, привычки и самодисциплина' },
] as const

const activeTab = ref<string>('programs')

const activeTabDescription = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab?.description ?? ''
})

const { getActionsByCategory, canExecute, executeAction, actionsEmptyHint } = useActions()
const educationActions = getActionsByCategory('education') as any
const selfdevActions = getActionsByCategory('selfdev') as any
</script>

<style scoped lang="scss">
.education-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edu-tabs {
  display: flex;
  gap: $space-1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.edu-tab {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg-card);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-card);

  &:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  &--active {
    background: var(--color-accent);
    border-color: var(--color-accent);

    .edu-tab__label {
      color: var(--color-text-on-accent);
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
  font-size: $font-size-sm;
  line-height: 1;
}

.edu-tab__label {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--color-text-primary);
  line-height: 1;
}

.edu-tab-description {
  font-size: $font-size-xs;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: $line-height-base;
}
</style>
