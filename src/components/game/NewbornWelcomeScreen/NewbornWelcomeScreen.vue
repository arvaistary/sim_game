<template>
  <div
    class="newborn-welcome"
    :class="{ 'newborn-welcome--visible': visible }"
  >
    <div class="newborn-welcome__content">
      <div class="newborn-welcome__icon">👶</div>
      <h1 class="newborn-welcome__title">Добро пожаловать в мир, {{ name }}.</h1>

      <p class="newborn-welcome__description">
        Ты только что родился. Впереди короткий путь: детство, школа и выбор — техникум или университет.
        К 18 годам ты войдёшь во взрослую жизнь с историей, а не с чистого листа.
      </p>

      <button
        class="newborn-welcome__button"
        type="button"
        @click="onStart"
      >
        Начать пролог
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import './NewbornWelcomeScreen.scss'
import type { ComputedRef, Ref } from 'vue'
import type {
  NewbornWelcomeScreenEmits,
  NewbornWelcomeScreenProps,
} from './NewbornWelcomeScreen.types'

const props = withDefaults(defineProps<NewbornWelcomeScreenProps>(), {
  playerName: 'Алексей',
})

const emit = defineEmits<NewbornWelcomeScreenEmits>()

const visible: Ref<boolean> = ref(false)
const name: ComputedRef<string> = computed(() => props.playerName)

onMounted(() => {
  window.setTimeout(() => {
    visible.value = true
  }, 100)
})

function onStart(): void {
  visible.value = false
  emit('start')
}
</script>
