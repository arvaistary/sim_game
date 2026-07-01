<template>
  <Modal :is-open="state.isOpen" :title="state.title" @close="close">
    <div class="game-modal-host">
      <p v-if="state.message" class="game-modal-host__message">{{ state.message }}</p>
      <p v-if="state.actionResultMeta" class="game-modal-host__meta">{{ state.actionResultMeta }}</p>

      <template v-if="state.actionResultLines.length > 0">
        <div v-for="(item, index) in state.actionResultLines" :key="index" class="game-modal-host__line">
          <StatChange :text="item.text" :explanation="item.explanation" />
        </div>
      </template>
      <template v-else>
        <template v-for="(item, index) in processedLines" :key="index">
          <div class="game-modal-host__line">
            <StatChange :text="item.text" :explanation="item.explanation" />
          </div>
        </template>
      </template>
    </div>

    <template v-if="state.buttons?.length" #actions>
      <GameButton
        v-for="(btn, index) in state.buttons"
        :key="index"
        :label="btn.label"
        :accent-key="btn.accent ? 'accent' : undefined"
        @click="handleButtonClick(btn)"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { STAT_LABELS_RU, METRIC_LABELS } from '@/constants/metric-labels'
import type { GameModalButton } from '@/composables/useGameModal'
import type { ProcessedLine } from './GameModalHost.types'

const { state, close } = useGameModal()

const RUSSIAN_TO_KEY: Record<string, string> = {}
for (const [key, label] of Object.entries({ ...STAT_LABELS_RU, ...METRIC_LABELS })) {
  RUSSIAN_TO_KEY[label.toLowerCase()] = key
}

function handleButtonClick(btn: GameModalButton): void {
  if (btn.action) {
    btn.action()
    close()
    return
  }

  if (btn.route) {
    close()
    navigateTo(btn.route)
    return
  }

  close()
}

/**
 * Разбор строки вида «Характеристика ±число» с многословными названиями.
 */
const STAT_CHANGE_LINE_RE: RegExp = /^([a-zA-Zа-яА-ЯёЁ\s]+?)\s*([+-]\d+(?:\.\d+)?)$/i

function getExplanation(statKey: string, finalValue: number): string {
  const englishKey: string = RUSSIAN_TO_KEY[statKey.toLowerCase()] ?? statKey

  const baseValue: number | undefined = state.value.baseStatValues?.[englishKey]

  if (baseValue === undefined || baseValue === finalValue) {
    return ''
  }

  const diff: number = finalValue - baseValue
  const diffPercent: number = baseValue !== 0 ? Math.round((diff / Math.abs(baseValue)) * 100) : 0

  if (Math.abs(diffPercent) < 5) {
    return ''
  }
  return `относительно строки эффекта: ${diffPercent > 0 ? '+' : ''}${diffPercent}%`
}

const processedLines: ComputedRef<ProcessedLine[]> = computed((): ProcessedLine[] => {
  const result: ProcessedLine[] = []

  for (const line of state.value.lines ?? []) {
    const parts: string[] = line.split('•')

    if (parts.length > 1) {
      for (const part of parts) {
        const trimmed: string = part.trim()

        if (!trimmed) continue

        if (/[a-zа-яё]+\s*[+-]\d+(\.\d+)?/i.test(trimmed)) {
          const statChanges: string[] = trimmed.split(',').map((s: string) => s.trim()).filter(Boolean)
          for (const change of statChanges) {
            const match: RegExpMatchArray | null = change.match(STAT_CHANGE_LINE_RE)

            if (match) {
              const statKey: string = (match[1] ?? '').trim().toLowerCase()
              const finalValue: number = parseFloat(match[2] ?? '0')
              const explanation: string = getExplanation(statKey, finalValue)
              result.push({ text: change, explanation })
            } else {
              result.push({ text: change })
            }
          }
        } else {
          result.push({ text: trimmed })
        }
      }
    } else {
      const trimmed: string = line.trim()

      if (trimmed.includes(',') && /[a-zа-яё]+\s*[+-]\d+(\.\d+)?/i.test(trimmed)) {
        const statChanges: string[] = trimmed.split(',').map((s: string) => s.trim()).filter(Boolean)
        for (const change of statChanges) {
          const match: RegExpMatchArray | null = change.match(STAT_CHANGE_LINE_RE)

          if (match) {
            const statKey: string = (match[1] ?? '').trim().toLowerCase()
            const finalValue: number = parseFloat(match[2] ?? '0')
            const explanation: string = getExplanation(statKey, finalValue)
            result.push({ text: change, explanation })
          } else {
            result.push({ text: change })
          }
        }
      } else {
        result.push({ text: trimmed })
      }
    }
  }

  return result.length > 0 ? result : (state.value.lines ?? []).map((line: string): ProcessedLine => ({ text: line, explanation: undefined }))
})
</script>

<style scoped lang="scss">
.game-modal-host {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.game-modal-host__message {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text, #e0e0e0);
}

.game-modal-host__meta {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-text-muted, #888);
}

.game-modal-host__line {
  padding: 4px 0;
}
</style>
