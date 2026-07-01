<template>
  <button
    class="game-button"
    :class="[
      `game-button--${resolvedVariant}`,
      {
        'game-button--disabled': disabled,
        'game-button--small': small,
      },
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">
import './style.scss'

interface GameButtonProps {
  label?: string
  /** @deprecated используйте variant — оставлен для обратной совместимости */
  color?: string
  /** @deprecated используйте variant — оставлен для обратной совместимости */
  textColor?: string
  disabled?: boolean
  small?: boolean
  /**
   * Ключ акцентной палитры (legacy). Backwards-compat для старых вызовов
   * (CurrentJobPanel / GameModalHost / WorkShiftPanel передают accent-key).
   */
  accentKey?: 'accent' | 'sage' | 'danger' | 'primary' | 'ghost'
  /** Канонический вариант кнопки (Linear-эстетика). Приоритет над accentKey. */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

const props = withDefaults(defineProps<GameButtonProps>(), {
  color: '',
  textColor: '',
  disabled: false,
  small: false,
  accentKey: undefined,
  variant: undefined,
})

defineEmits<{
  click: [event?: MouseEvent]
}>()

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

// Приоритет: explicit variant > accentKey mapping > default 'primary'
const resolvedVariant = computed<ButtonVariant>(() => {
  if (props.variant) return props.variant

  if (props.accentKey) {
    const accentMap: Record<NonNullable<GameButtonProps['accentKey']>, ButtonVariant> = {
      accent: 'primary',
      primary: 'primary',
      sage: 'secondary',
      danger: 'danger',
      ghost: 'ghost',
    }
    return accentMap[props.accentKey]
  }

  return 'primary'
})
</script>
