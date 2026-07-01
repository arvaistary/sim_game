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
import './StatChange.scss'
import type { ComputedRef } from 'vue'
import { STAT_LABELS_RU, METRIC_LABELS } from '@/constants/metric-labels'
import type { StatChangeDisplay, StatChangeProps } from './StatChange.types'

const props = defineProps<StatChangeProps>()

// Объединяем все русские названия
const RU_LABELS: Record<string, string> = {
  ...STAT_LABELS_RU,
  ...METRIC_LABELS,
}

// Маппинг названий характеристик на иконки (русские и английские)
const ICON_MAP: Record<string, string> = {
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

const change = computed<StatChangeDisplay>(() => {
  const text: string = props.text.trim()

  const match: RegExpMatchArray | null = text.match(/^([a-zA-Zа-яА-ЯёЁ\s]+?)\s*([+-]\d+(?:\.\d+)?)$/i)

  if (!match) {
    return {
      icon: '📊',
      name: text,
      value: 0,
      isPositive: true,
    }
  }

  const [, nameRaw, valueRaw]: RegExpMatchArray = match
  const nameKey: string = (nameRaw ?? '').trim().toLowerCase()
  const value: number = parseFloat(valueRaw ?? '0')

  const displayName: string = RU_LABELS[nameKey] ?? nameKey.charAt(0).toUpperCase() + nameKey.slice(1)

  let icon: string = '📊'
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

const explanationText: ComputedRef<string> = computed(() => {
  return props.explanation ?? ''
})
</script>
