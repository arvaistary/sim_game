<template>
  <div class="newborn-welcome" :class="{ 'newborn-welcome--visible': visible }">
    <div class="newborn-welcome__content">
      <div class="newborn-welcome__icon">👶</div>
      <h1 class="newborn-welcome__title">Добро пожаловать в мир, {{ playerName }}.</h1>

      <p class="newborn-welcome__description">
        Ты только что родился. Ты ничего не умеешь, у тебя нет денег, нет навыков.
        Вся жизнь перед тобой. Пройди все этапы взросления, стань тем кем хочешь.
      </p>

      <button class="newborn-welcome__button" @click="onStart">
        Начать
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/game.store'

const store = useGameStore()
const visible = ref(false)

const playerName = computed(() => store.playerName)

onMounted(() => {
  setTimeout(() => {
    visible.value = true
  }, 100)
})

function onStart() {
  visible.value = false
  store.welcomeScreenShown = true
}

defineExpose({
  visible,
})
</script>

<style scoped lang="scss">
.newborn-welcome {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.8s ease;

  &--visible {
    opacity: 1;
    pointer-events: all;
  }

  &__content {
    text-align: center;
    max-width: 600px;
    padding: 40px;
    transform: translateY(20px);
    opacity: 0;
    transition: all 1s ease 0.3s;
  }

  &--visible &__content {
    transform: translateY(0);
    opacity: 1;
  }

  &__icon {
    font-size: 80px;
    margin-bottom: 30px;
    animation: babyBounce 2s ease-in-out infinite;
  }

  &__title {
    font-size: 32px;
    font-weight: 600;
    color: white;
    margin-bottom: 24px;
    line-height: 1.3;
  }

  &__description {
    font-size: 18px;
    color: #cbd5e1;
    line-height: 1.6;
    margin-bottom: 40px;
  }

  &__button {
    padding: 16px 48px;
    font-size: 18px;
    font-weight: 500;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    transform: translateY(0);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@keyframes babyBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
