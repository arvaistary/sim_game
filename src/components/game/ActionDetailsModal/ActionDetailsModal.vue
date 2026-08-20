<template>
  <Modal
    :is-open="isOpen"
    :title="resolvedTitle"
    max-width="407px"
    @close="$emit('close')"
  >
    <template v-if="image" #media>
      <img class="action-details__image" :src="image" alt="">
    </template>

    <div class="action-details">
      <p v-if="resolvedDescription" class="action-details__description">{{ resolvedDescription }}</p>
      <p class="action-details__meta">{{ priceLabel }}<span v-if="action.hourCost"> · {{ action.hourCost }} ч</span></p>

      <section v-if="resourceEffects.length" class="action-details__group" :aria-labelledby="resourceEffectsTitleId">
        <h4 :id="resourceEffectsTitleId" class="action-details__title">Ресурсы</h4>
        <div class="action-details__effects">
          <StatChange
            v-for="effect in resourceEffects"
            :key="effect.id"
            :text="effect.text"
            :explanation="effect.explanation"
          />
        </div>
      </section>

      <section v-if="skillEffects.length" class="action-details__group" :aria-labelledby="skillEffectsTitleId">
        <h4 :id="skillEffectsTitleId" class="action-details__title">Навыки</h4>
        <div class="action-details__effects">
          <StatChange
            v-for="effect in skillEffects"
            :key="effect.id"
            :text="effect.text"
            :explanation="effect.explanation"
          />
        </div>
      </section>

      <div v-if="hasFallbackEffects" class="action-details__effects" aria-label="Эффекты действия">
        <StatChange
          v-for="effect in fallbackEffects"
          :key="effect.id"
          :text="effect.text"
          :explanation="effect.explanation"
        />
      </div>
    </div>

    <template #actions>
      <div class="action-modal-actions">
        <button
          v-if="canAddToPlan"
          class="action-modal-actions__calendar"
          type="button"
          aria-label="Добавить в календарь"
          @click="$emit('addToPlan', $event)"
        >
          <span aria-hidden="true">+</span>
          <GameIcon name="calendar" :size="20" />
        </button>
        <GameButton
          :label="buttonLabel"
          :disabled="disabled"
          variant="primary"
          @click="$emit('execute')"
        />
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'

import './ActionDetailsModal.scss'
import Modal from '@/components/ui/Modal/index.vue'
import StatChange from '@/components/ui/StatChange/StatChange.vue'
import { formatEffect, formatMoney } from '@/utils/format'
import type { ActionEffectDisplay } from '@/components/game/ActionCard/ActionCard.types'
import { createResourceEffects, createSkillEffects } from '@/components/game/ActionCard/action-card-effects'
import type { ActionDetailsModalEmits, ActionDetailsModalProps } from './ActionDetailsModal.types'

const props = withDefaults(defineProps<ActionDetailsModalProps>(), {
  title: '',
  description: '',
  image: '',
  buttonLabel: 'Выполнить',
  disabled: false,
  showAddToPlan: true,
  useFormatEffect: false,
})

defineEmits<ActionDetailsModalEmits>()

const resolvedTitle: ComputedRef<string> = computed(() => props.title || props.action.title)

const resolvedDescription: ComputedRef<string> = computed(() => {
  const description: string = props.description || props.action.mood || ''
  return description.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji_Modifier}\uFE0F\u200D]+\s*/u, '')
})

const priceLabel: ComputedRef<string> = computed(() => {
  const price: number = props.action.price

  if (price === 0) return 'Бесплатно'

  return `${formatMoney(price)} ₽`
})

const canAddToPlan: ComputedRef<boolean> = computed(() => {
  return props.showAddToPlan && props.action.actionType !== 'sleep' && props.action.actionType !== 'work'
})

const resourceEffects: ComputedRef<ActionEffectDisplay[]> = computed(() => {
  return createResourceEffects(props.action.statChanges)
})

const skillEffects: ComputedRef<ActionEffectDisplay[]> = computed(() => {
  return createSkillEffects(props.action.skillChanges)
})

const fallbackEffects: ComputedRef<ActionEffectDisplay[]> = computed(() => {
  const hasStructuredEffects: boolean = resourceEffects.value.length > 0 || skillEffects.value.length > 0

  if (hasStructuredEffects) return []

  const effectText: string = props.useFormatEffect ? formatEffect(props.action.effect) : props.action.effect

  return effectText
    .split(/[•,]/)
    .map((part: string, index: number): ActionEffectDisplay => ({
      id: `effect-${index}`,
      text: part.trim(),
      explanation: 'Изменение характеристики за действие.',
    }))
    .filter((effect: ActionEffectDisplay) => effect.text.length > 0)
})

const hasFallbackEffects: ComputedRef<boolean> = computed(() => fallbackEffects.value.length > 0)
const resourceEffectsTitleId: ComputedRef<string> = computed(() => `resource-effects-${props.action.id}`)
const skillEffectsTitleId: ComputedRef<string> = computed(() => `skill-effects-${props.action.id}`)
</script>
