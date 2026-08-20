<template>
  <Tooltip :text="explanationText">
    <div class="stat-change" tabindex="0">
      <div class="stat-change__main">
        <GameIcon class="stat-change__icon" :name="change.icon" :size="16" />
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
    </div>
  </Tooltip>
</template>

<script setup lang="ts">
import './StatChange.scss'
import type { ComputedRef } from 'vue'
import { STAT_LABELS_RU, METRIC_LABELS } from '@/constants/metric-labels'
import Tooltip from '@/components/ui/Tooltip/index.vue'
import GameIcon from '@/components/ui/GameIcon/GameIcon.vue'
import { DEFAULT_STAT_CHANGE_ICON, resolveStatChangeIcon } from './stat-change-icons'
import type { StatChangeDisplay, StatChangeProps } from './StatChange.types'

const props = defineProps<StatChangeProps>()

const RU_LABELS: Record<string, string> = {
  ...STAT_LABELS_RU,
  ...METRIC_LABELS,
}

const change = computed<StatChangeDisplay>(() => {
  const text: string = props.text.trim()

  const match: RegExpMatchArray | null = text.match(/^([a-zA-Zа-яА-ЯёЁ\s]+?)\s*([+-]\d+(?:\.\d+)?)$/i)

  if (!match) {
    return {
      icon: DEFAULT_STAT_CHANGE_ICON,
      name: text,
      value: 0,
      isPositive: true,
    }
  }

  const [, nameRaw, valueRaw]: RegExpMatchArray = match
  const nameKey: string = (nameRaw ?? '').trim().toLowerCase()
  const value: number = parseFloat(valueRaw ?? '0')

  const displayName: string = RU_LABELS[nameKey] ?? nameKey.charAt(0).toUpperCase() + nameKey.slice(1)

  return {
    icon: resolveStatChangeIcon(nameKey),
    name: displayName,
    value,
    isPositive: value >= 0,
  }
})

const explanationText: ComputedRef<string> = computed(() => {

  if (props.explanation) return props.explanation

  const direction: string = change.value.value >= 0 ? 'Увеличивает' : 'Уменьшает'
  return `${direction} «${change.value.name}» на ${Math.abs(change.value.value)} за действие.`
})
</script>
