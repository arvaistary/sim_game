<template>
  <div class="stat-change">
    <div class="stat-change__main">
      <span class="stat-change__icon">
        {{ change.icon }}
      </span>
      <span class="stat-change__name">
        {{ change.name }}
      </span>
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
    <div
      v-if="explanationText"
      class="stat-change__explanation"
      >
      {{ explanationText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import './StatChange.scss'

import type { StatChange } from './StatChange.types'
import { RU_LABELS } from './StatChange.constants'
import { ICON_MAP } from './StatChange.constants'
/**
 * @prop {string} text - Текст изменения характеристики (например, «Здоровье +10»)
 * @prop {string} [explanation] - Пояснение к изменению
 */
const props = defineProps<{
  text: string
  explanation?: string
}>()

/**
 * Извлекает изменение характеристики из строки
 */
const change = computed<StatChange>(() => {
  const text: string = props.text.trim()

  // Паттерн: "name value" где value может быть +123 или -123 или +123.45
  const match: RegExpMatchArray | null = text.match(/^([a-zA-Zа-яА-ЯёЁ\s]+?)\s*([+-]\d+(?:\.\d+)?)$/i)

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
  const nameKey: string = nameRaw!.trim().toLowerCase()
  const value: number = parseFloat(valueRaw!)

  // Получаем русское название
  let displayName: string = RU_LABELS[nameKey] ?? nameKey.charAt(0).toUpperCase() + nameKey.slice(1)

  // Определяем иконку
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

const explanationText = computed<string>(() => {
  return props.explanation ?? ''
})
</script>
