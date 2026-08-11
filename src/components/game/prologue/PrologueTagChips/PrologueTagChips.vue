<template>
  <div class="prologue-tag-chips">
    <span
      v-for="chip in chips"
      :key="chip.id"
      class="prologue-tag-chips__chip"
    >
      {{ chip.label }}
      <span class="prologue-tag-chips__dots">{{ chip.dots }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import './PrologueTagChips.scss'
import type { ComputedRef } from 'vue'
import { PROLOGUE_TAG_LABELS } from '@/domain/balance/constants/prologue/tag-catalog'
import type { PrologueTagId } from '@/domain/prologue/prologue.types'
import type { PrologueTagChipsProps, TagChipView } from './PrologueTagChips.types'

const props = defineProps<PrologueTagChipsProps>()

const chips: ComputedRef<TagChipView[]> = computed(() => {
  return (Object.keys(PROLOGUE_TAG_LABELS) as PrologueTagId[])
    .filter((tagId: PrologueTagId) => (props.tagPoints[tagId] ?? 0) > 0)
    .map((tagId: PrologueTagId) => {
      const value: number = props.tagPoints[tagId] ?? 0
      const filled: number = Math.min(3, value)
      const dots: string = `${'●'.repeat(filled)}${'○'.repeat(Math.max(0, 3 - filled))}`

      return {
        id: tagId,
        label: PROLOGUE_TAG_LABELS[tagId],
        dots,
      }
    })
})
</script>
