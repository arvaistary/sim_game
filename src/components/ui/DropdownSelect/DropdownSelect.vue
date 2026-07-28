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
          <span
            v-if="option.value === modelValue"
            class="dropdown-select__check"
            aria-hidden="true"
          >✓</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface DropdownOption {
  label: string
  value: string
}

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

<style scoped lang="scss">
@use '@/assets/scss/variables' as *;

.dropdown-select {
  position: relative;
  width: 100%;
}

.dropdown-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);

  &:hover,
  &:focus-visible,
  .dropdown-select--open & {
    outline: none;
    border-color: var(--color-action-primary);
    box-shadow: 0 0 0 2px var(--color-pastel-green);
  }
}

.dropdown-select__chevron {
  width: 8px;
  height: 8px;
  margin-left: $space-2;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
  transition: transform var(--transition-fast);
}

.dropdown-select--open .dropdown-select__chevron {
  transform: translateY(2px) rotate(225deg);
}

.dropdown-select__menu {
  position: absolute;
  z-index: $z-index-dropdown;
  top: calc(100% + $space-1);
  right: 0;
  left: 0;
  max-height: 260px;
  overflow-y: auto;
  padding: $space-1;
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  background: var(--color-bg-card);
  box-shadow: var(--shadow-popover);
}

.dropdown-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: $space-2 $space-3;
  border: 0;
  border-radius: $radius-md;
  background: transparent;
  color: var(--color-text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);

  &:hover,
  &:focus-visible,
  &.dropdown-select__option--selected {
    outline: none;
    background: var(--color-pastel-green);
    color: var(--color-pastel-green-strong);
  }
}

.dropdown-select__check {
  margin-left: $space-2;
  color: var(--color-action-primary);
  font-weight: $font-weight-bold;
}

.dropdown-select-enter-active,
.dropdown-select-leave-active {
  transform-origin: top;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.dropdown-select-enter-from,
.dropdown-select-leave-to {
  opacity: 0;
  transform: translateY(-4px) scaleY(0.98);
}
</style>
