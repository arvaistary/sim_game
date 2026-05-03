<template>
  <Modal
    :is-open="state.isOpen"
    :title="state.title"
    @close="close"
    >
    <div class="game-modal-host">
      <p
        v-if="state.message"
        class="game-modal-host__message"
        >
        {{ state.message }}
      </p>
      <p
        v-if="state.actionResultMeta"
        class="game-modal-host__meta"
        >
        {{ state.actionResultMeta }}
      </p>

      <template v-if="state.actionResultLines.length > 0">
        <div
          v-for="(item, index) in state.actionResultLines"
          :key="index"
          class="game-modal-host__line"
          >
          <StatChange
            :text="item.text"
            :explanation="item.explanation"
            />
        </div>
      </template>
      <template v-else>
        <template
          v-for="(item, index) in processedLines"
          :key="index"
          >
          <div class="game-modal-host__line">
            <StatChange
              :text="item.text"
              :explanation="item.explanation"
              />
          </div>
        </template>
      </template>
    </div>

    <template v-if="(state.buttons ?? []).length > 0" #actions>
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
import './GameModalHost.scss'

import type { ResultItem } from './GameModalHost.types'
import type { GameModalButton } from '@composables/useGameModal/modal.types'
import { RUSSIAN_TO_KEY, STAT_CHANGE_LINE_RE } from './GameModalHost.constants'

const { state, close } = useGameModal()

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
 * @description GameModalHost - Разбор строки вида «Характеристика ±число» с многословными названиями.
 * @param {string} statKey - Ключ характеристики.
 * @param {number} finalValue - Итоговое значение.
 * @return {string} Пояснение с процентным изменением или пустая строка.
 */
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

const processedLines = computed<Array<ResultItem>>(() => {
  let result: Array<ResultItem> = []

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
              const statKey: string = match[1]!.trim().toLowerCase()
              const finalValue: number = parseFloat(match[2]!)
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
            const statKey: string = match[1]!.trim().toLowerCase()
            const finalValue: number = parseFloat(match[2]!)
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

  return result.length > 0 ? result : (state.value.lines ?? []).map((line: string) => ({ text: line, explanation: undefined }))
})
</script>
