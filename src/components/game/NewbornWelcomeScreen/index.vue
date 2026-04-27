<template>
  <div
    :class="{ 'newborn-welcome--visible': visible }"
    class="newborn-welcome"
    >
    <div class="newborn-welcome__content">
      <div class="newborn-welcome__icon">
        👶
      </div>
      <h1 class="newborn-welcome__title">
        Добро пожаловать в мир, {{ playerName }}.
      </h1>

      <p class="newborn-welcome__description">
        Ты только что родился. Ты ничего не умеешь, у тебя нет денег, нет навыков.
        Вся жизнь перед тобой. Пройди все этапы взросления, стань тем кем хочешь.
      </p>

      <button
        @click="onStart"
        class="newborn-welcome__button"
        >
        Начать
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import './index.scss'

const visible = ref(false)
const playerName = ref('Алексей')
const welcomeScreenShown = ref(false)

onMounted(() => {
  setTimeout(() => {
    visible.value = true
  }, 100)
})

function onStart() {
  visible.value = false
  welcomeScreenShown.value = true
}

defineExpose({
  visible,
  welcomeScreenShown,
})
</script>

