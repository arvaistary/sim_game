<template>
  <div class="login-page">
    <aside class="login-page__brand">
      <div class="login-page__logo">GL</div>
      <div class="login-page__brand-text">
        <h1 class="login-page__brand-title">Game Life</h1>
        <p class="login-page__brand-tagline">Закрытый тестовый проект</p>
      </div>
      <span class="login-page__brand-copy">Private preview</span>
    </aside>

    <main class="login-page__panel">
      <form class="login-page__form" @submit.prevent="submit">
        <div>
          <p class="login-page__eyebrow">Доступ к preview</p>
          <h2 class="login-page__title">Войти в Game Life</h2>
          <p class="login-page__subtitle">Введите локальные тестовые credentials, чтобы продолжить.</p>
        </div>

        <label class="login-page__label" for="login-username">Логин</label>
        <input
          id="login-username"
          v-model="username"
          class="login-page__input"
          type="text"
          autocomplete="username"
          required
        >

        <label class="login-page__label" for="login-password">Пароль</label>
        <input
          id="login-password"
          v-model="password"
          class="login-page__input"
          type="password"
          autocomplete="current-password"
          required
        >

        <p
          v-if="errorMessage"
          class="login-page__error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <button
          class="login-page__button"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Проверяем…' : 'Войти' }}
        </button>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import '@/pages/index.scss'

const route = useRoute()

const username = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const gameStore = useGameStore()

const redirectPath = computed(() => {
  const value = route.query.redirect

  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/'

  return value
})

async function submit(): Promise<void> {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })
    await gameStore.initializeServerSession()
    await navigateTo(redirectPath.value)
  } catch (error: unknown) {
    const fetchError = error as { statusCode?: number; data?: { message?: string } }
    errorMessage.value = fetchError.statusCode === 503
      ? 'Локальные креды не настроены.'
      : fetchError.data?.message ?? 'Не удалось войти. Проверьте данные.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
