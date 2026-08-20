<template>
  <Tooltip
    :text="disabled && disabledReason ? disabledReason : undefined"
    :follow-cursor="true"
    stretch
    multiline
  >
    <RoundedPanel
      class="action-card"
      :class="{ 'action-card--disabled': disabled }"
      padding="14px 16px"
      :radius="14"
    >
      <div class="action-card__content" @click="handleCardClick">
        <div class="card-header">
          <h3 class="card-title">{{ action.title }}</h3>
          <span class="card-price metric">{{ priceLabel }}</span>
        </div>
        <p v-if="displayDescription" class="card-description">{{ displayDescription }}</p>
        <div class="card-footer">
          <ActionCardButtons
            :disabled="disabled"
            :show-calendar="showAddToPlan && action.actionType !== 'sleep' && action.actionType !== 'work'"
            @calendar="handleAddToPlan"
            @execute="handleButtonClick"
          />
        </div>
      </div>
    </RoundedPanel>
  </Tooltip>

  <ActionDetailsModal
    v-if="showDetails"
    :is-open="isDetailsOpen"
    :action="action"
    :image="actionImage"
    :button-label="buttonLabel"
    :disabled="disabled"
    :show-add-to-plan="showAddToPlan"
    :use-format-effect="useFormatEffect"
    @close="closeDetails"
    @execute="handleModalButtonClick"
    @add-to-plan="handleAddToPlan"
  />
</template>

<script setup lang="ts">
import './ActionCard.scss'
import { formatMoney } from '@/utils/format'
import type { ActionCardEmits, ActionCardProps } from './ActionCard.types'
import { useCalendarPlanActions } from '@/composables/useCalendarPlan'

const props = withDefaults(defineProps<ActionCardProps>(), {
  disabled: false,
  disabledReason: '',
  buttonLabel: 'Выполнить',
  showPriceWhenZero: false,
  showDetails: true,
  useFormatEffect: false,
  showAddToPlan: true,
})

const emit = defineEmits<ActionCardEmits>()

const calendarActions = useCalendarPlanActions()

const toast = useToast()

const isDetailsOpen = ref<boolean>(false)

const actionImage = computed<string | undefined>(() => {
  if (props.action.id === 'fun_cinema') return '/image/actions/fun-cinema.png'
  return undefined
})

const displayDescription = computed<string>(() => {
  const description: string = props.action.mood ?? ''
  return description.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji_Modifier}\uFE0F\u200D]+\s*/u, '')
})

const priceLabel = computed<string>(() => {
  if (props.action.price === 0) return props.showPriceWhenZero ? 'Бесплатно' : ''
  return `${formatMoney(props.action.price)} ₽`
})

function handleCardClick(): void {
  if (props.disabled && props.disabledReason) {
    toast.showInfo(props.disabledReason)
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

function handleModalButtonClick(): void {
  closeDetails()
  handleButtonClick()
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
