<template>
  <div
    ref="root"
    class="dropdown-select"
    :class="{ 'dropdown-select--open': isOpen }"
  >
    <button
      class="dropdown-select__trigger"
      type="button"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown.esc="close"
    >
      <span>{{ selectedOption?.label ?? '' }}</span>
      <span class="dropdown-select__chevron" aria-hidden="true" />
    </button>

    <Transition name="dropdown-select">
      <div
        v-if="isOpen"
        class="dropdown-select__menu"
        role="listbox"
        tabindex="-1"
        @keydown.esc.stop="close"
      >
        <button
          v-for="option in options"
          :key="option.value"
          class="dropdown-select__option"
          :class="{ 'dropdown-select__option--selected': option.value === modelValue }"
          type="button"
          role="option"
          :aria-selected="option.value === modelValue"
          @click="selectOption(option.value)"
        >
          <span>{{ option.label }}</span>
          <GameIcon
            v-if="option.value === modelValue"
            class="dropdown-select__check"
            name="check-circle"
            :size="14"
            :stroke-width="2"
          />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GameIcon from '@/components/ui/GameIcon/GameIcon.vue'
import type { DropdownOption } from './DropdownSelect.types'

const props = defineProps<{
  modelValue: string
  options: readonly DropdownOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const root = ref<HTMLElement | null>(null)

const isOpen = ref(false)

const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue))

function toggle(): void {
  isOpen.value = !isOpen.value
}

function close(): void {
  isOpen.value = false
}

function selectOption(value: string): void {
  emit('update:modelValue', value)
  close()
  root.value?.querySelector<HTMLButtonElement>('.dropdown-select__trigger')?.focus()
}

function handleDocumentClick(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) close()
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>
