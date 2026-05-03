<template>
  <div
    @scroll="onScroll"
    ref="scrollRef"
    class="log-scroll"
    >
    <RoundedPanel
      v-for="entry in entries"
      :key="entry.day + '-' + entry.type + '-' + entry.title"
      :class="'log-entry--' + entry.type"
      class="log-entry"
      >
      <div class="entry-header">
        <span class="entry-title">
          {{ entry.title }}
        </span>
        <span class="entry-day">
          День {{ entry.day }}
        </span>
      </div>
      <p
        v-if="entry.description"
        class="entry-desc"
        >
        {{ entry.description }}
      </p>
    </RoundedPanel>

    <RoundedPanel
      v-if="entries.length === 0"
      class="empty-panel"
      >
      <p class="empty-text">
        Записей пока нет
      </p>
    </RoundedPanel>

    <div
      v-if="isLoading"
      class="loading"
      >
      Загрузка…
    </div>
  </div>
</template>

<script setup lang="ts">
import './ActivityLogList.scss'

const { entries, loadMore } = useActivityLog()

const scrollRef = ref<HTMLElement | null>(null)
const isLoading = ref(false)

function onScroll() {
  const el = scrollRef.value

  if (!el) return
  const threshold: number = 200

  if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
    isLoading.value = true
    loadMore()
    setTimeout(() => { isLoading.value = false }, 100)
  }
}
</script>

