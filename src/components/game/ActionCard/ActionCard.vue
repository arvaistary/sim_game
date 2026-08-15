<template>
  <Tooltip :text="disabled && disabledReason ? disabledReason : undefined" :follow-cursor="true" multiline>
    <RoundedPanel
      class="action-card"
      :class="{ 'action-card--disabled': disabled }"
      padding="var(--space-card-padding)"
    >
      <div class="action-card__content" @click="handleCardClick">
        <div class="card-header">
          <h3 class="card-title">{{ action.title }}</h3>
          <span class="card-price metric">{{ priceLabel }}</span>
        </div>
        <p v-if="action.mood" class="card-description">{{ action.mood }}</p>
        <div class="card-footer">
          <GameButton
            v-if="showAddToPlan && action.actionType !== 'sleep' && action.actionType !== 'work'"
            label="В календарь"
            variant="secondary"
            small
            @click="handleAddToPlan"
          />
          <GameButton
            :label="buttonLabel"
            :disabled="disabled"
            variant="primary"
            small
            @click="handleButtonClick"
          />
        </div>
      </div>
    </RoundedPanel>
  </Tooltip>

  <Modal
    v-if="showDetails"
    :is-open="isDetailsOpen"
    :title="action.title"
    max-width="560px"
    @close="closeDetails"
  >
    <div class="action-details">
      <p v-if="action.mood" class="action-details__description">{{ action.mood }}</p>
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
      <GameButton
        :label="buttonLabel"
        :disabled="disabled"
        variant="primary"
        @click="handleModalButtonClick"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import './ActionCard.scss'
import { METRIC_LABELS } from '@/constants/metric-labels'
import { formatEffect, formatMoney } from '@/utils/format'
import StatChange from '@/components/ui/StatChange/StatChange.vue'
import Modal from '@/components/ui/Modal/index.vue'
import type { ActionCardEmits, ActionCardProps, ActionEffectDisplay } from './ActionCard.types'
import { useCalendarPlanActions } from '@/composables/useCalendarPlan'
import { createSkillEffects } from './action-card-effects'

const props = withDefaults(defineProps<ActionCardProps>(), {
  disabled: false,
  disabledReason: '',
  buttonLabel: 'Выполнить',
  showPriceWhenZero: false,
  showDetails: true,
  useFormatEffect: false,
})

const emit = defineEmits<ActionCardEmits>()

const calendarActions = useCalendarPlanActions()

const toast = useToast()

const isDetailsOpen = ref<boolean>(false)

const displayEffect = computed<string>(() => {
  if (props.useFormatEffect) return formatEffect(props.action.effect)
  return props.action.effect
})

const priceLabel = computed<string>(() => {
  if (props.action.price === 0) return 'Бесплатно'
  return `${formatMoney(props.action.price)} ₽`
})

const resourceEffects = computed<ActionEffectDisplay[]>(() => {
  return createEffects(props.action.statChanges, 'resource')
})

const skillEffects = computed<ActionEffectDisplay[]>(() => {
  return createSkillEffects(props.action.skillChanges)
})

const fallbackEffects = computed<ActionEffectDisplay[]>(() => {
  if (resourceEffects.value.length > 0 || skillEffects.value.length > 0) return []

  return displayEffect.value
    .split(/[•,]/)
    .map((effectText: string, index: number): ActionEffectDisplay => ({
      id: `effect-${index}`,
      text: effectText.trim(),
      explanation: 'Изменение характеристики за действие.',
    }))
    .filter((effect: ActionEffectDisplay) => effect.text.length > 0)
})

const hasFallbackEffects = computed<boolean>(() => fallbackEffects.value.length > 0)
const resourceEffectsTitleId = computed<string>(() => `resource-effects-${props.action.id}`)
const skillEffectsTitleId = computed<string>(() => `skill-effects-${props.action.id}`)

function createEffects(changes: Record<string, number | undefined> | undefined, group: 'resource'): ActionEffectDisplay[] {
  if (!changes) return []

  return Object.entries(changes)
    .filter(([, value]: [string, number | undefined]) => typeof value === 'number' && value !== 0)
    .map(([key, value]: [string, number | undefined]): ActionEffectDisplay => {
      const numericValue: number = value as number
      const label: string = METRIC_LABELS[key] ?? key

      return {
        id: `${group}-${key}`,
        text: formatEffectValue(label, numericValue),
        explanation: getEffectExplanation(label, numericValue),
      }
    })
}

function formatEffectValue(label: string, value: number): string {
  const displayValue: number = Number(value.toFixed(2))
  const sign: string = displayValue > 0 ? '+' : ''
  return `${label} ${sign}${displayValue}`
}

function getEffectExplanation(label: string, value: number): string {
  const direction: string = value > 0 ? 'увеличится' : 'уменьшится'
  const target: string = 'значение ресурса'
  return `${target} «${label}» ${direction} на ${Math.abs(value)} за действие.`
}

function handleCardClick(): void {
  if (props.disabled && props.disabledReason) {
    toast.showInfo(`🔒 ${props.disabledReason}`)
    return
  }

  if (props.showDetails) isDetailsOpen.value = true
}

function handleButtonClick(event?: MouseEvent): void {
  event?.stopPropagation()
  emit('execute', props.action.id)
}

function closeDetails(): void {
  isDetailsOpen.value = false
}

function handleModalButtonClick(event?: MouseEvent): void {
  closeDetails()
  handleButtonClick(event)
}

function handleAddToPlan(event?: MouseEvent): void {
  event?.stopPropagation()
  const errorMessage: string | null = calendarActions.addAction(0, props.action.id)

  if (errorMessage !== null) {
    toast.showInfo(errorMessage)
    return
  }

  toast.showInfo('Действие добавлено в календарь')
}
</script>
