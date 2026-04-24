<template>
  <div class="stat-change">
    <div class="stat-change__main">
      <span class="stat-change__icon">{{ change.icon }}</span>
      <span class="stat-change__name">{{ change.name }}</span>
      <span
        v-if="change.value !== 0"
        :class="[
          'stat-change__value',
          change.isPositive ? 'stat-change__value--positive' : 'stat-change__value--negative'
        ]"
      >
        {{ change.isPositive ? '+' : '' }}{{ change.value }}
      </span>
    </div>
    <div v-if="explanationText" class="stat-change__explanation">
      {{ explanationText }}
    </div>
  </div>
</template>

<script setup lang="ts">

import { STAT_LABELS_RU, METRIC_LABELS } from '@/constants/metric-labels'

const props = defineProps<{
  text: string
  explanation?: string
}>()

// Объединяем все русские названия
const RU_LABELS: Record<string, string> = {
  ...STAT_LABELS_RU,
  ...METRIC_LABELS,
}

// Маппинг названий характеристик на иконки (русские и английские)
const ICON_MAP: Record<string, string> = {
  // Русские названия
  'здоровье': '❤️',
  'стресс': '😌',
  'настроение': '😊',
  'энергия': '⚡',
  'голод': '🍽️',
  'социальность': '👥',
  'интеллект': '🧠',
  'креативность': '🎨',
  'удача': '🍀',
  'репутация': '⭐',
  'опыт': '💫',
  'деньги': '💵',
  'резерв': '💰',
  'пассивный доход': '📈',
  'финансовая грамотность': '📚',
  'аналитическое мышление': '🔍',
  'эмоциональный интеллект': '💭',
  'медицинские знания': '🏥',
  'инвестиции': '📊',
  'риск': '⚠️',
  'работа': '💼',
  'карьера': '🎯',
  'образование': '🎓',
  'навыки': '🛠️',
  'отношения': '💕',
  'дружба': '🤝',
  'семья': '👨‍👩‍👧‍👦',
  'хобби': '🎮',
  'развлечения': '🎭',
  'спорт': '🏃',
  'сон': '😴',
  'время': '⏱️',
  'час': '⏱️',
  
  // Английские названия
  'health': '❤️',
  'stress': '😌',
  'mood': '😊',
  'energy': '⚡',
  'hunger': '🍽️',
  'social': '👥',
  'intelligence': '🧠',
  'creativity': '🎨',
  'luck': '🍀',
  'reputation': '⭐',
  'xp': '💫',
  'experience': '💫',
  'money': '💵',
  'reserve': '💰',
  'income': '📈',
  'financial': '📚',
  'analytical': '🔍',
  'emotional': '💭',
  'medical': '🏥',
  'investment': '📊',
  'work': '💼',
  'career': '🎯',
  'education': '🎓',
  'skill': '🛠️',
  'relationship': '💕',
  'friendship': '🤝',
  'family': '👨‍👩‍👧‍👦',
  'hobby': '🎮',
  'fun': '🎭',
  'sport': '🏃',
  'sleep': '😴',
  'physical': '💪',
  'time': '⏱️',
  'hour': '⏱️',
}

interface StatChange {
  icon: string
  name: string
  value: number
  isPositive: boolean
}

/**
 * Извлекает изменение характеристики из строки
 */
const change = computed<StatChange>(() => {
  const text = props.text.trim()
  
  // Паттерн: "name value" где value может быть +123 или -123 или +123.45
  const match = text.match(/^([a-zA-Zа-яА-ЯёЁ\s]+?)\s*([+-]\d+(?:\.\d+)?)$/i)
  
  if (!match) {
    // Если не удалось распознать, возвращаем как обычный текст

    return {
      icon: '📊',
      name: text,
      value: 0,
      isPositive: true,
    }
  }
  
  const [, nameRaw, valueRaw] = match
  const nameKey = nameRaw.trim().toLowerCase()
  const value = parseFloat(valueRaw)
  
  // Получаем русское название
  let displayName = RU_LABELS[nameKey] ?? nameKey.charAt(0).toUpperCase() + nameKey.slice(1)
  
  // Определяем иконку
  let icon = '📊'
  for (const [key, iconValue] of Object.entries(ICON_MAP)) {
    if (nameKey.includes(key) || key.includes(nameKey)) {
      icon = iconValue
      break
    }
  }
  
  return {
    icon,
    name: displayName,
    value,
    isPositive: value >= 0,
  }
})

const explanationText = computed(() => {
  return props.explanation ?? ''
})
</script>

<style scoped lang="scss">
.stat-change {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  // background: rgba(255, 255, 255, 0.05);
  // border-radius: 8px;
  // border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  width: 100%;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    // border-color: rgba(255, 255, 255, 0.15);
  }
}

.stat-change__main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-change__icon {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}

.stat-change__name {
  font-size: 14px;
  color: var(--color-text, #e0e0e0);
  line-height: 1.4;
  flex: 1;
}

.stat-change__value {
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  padding: 3px 8px;
  border-radius: 6px;
  margin-left: auto;
  flex-shrink: 0;
  
  &--positive {
    color: #4ade80;
    background: rgba(74, 222, 128, 0.15);
  }
  
  &--negative {
    color: #f87171;
    background: rgba(248, 113, 113, 0.15);
  }
}

.stat-change__explanation {
  font-size: 11px;
  color: var(--color-text-muted, #888);
  line-height: 1.3;
  padding-left: 26px;
  font-style: italic;
}
</style>
