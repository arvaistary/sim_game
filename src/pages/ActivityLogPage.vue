<template>
  <GameLayout title="Журнал">
    <div class="log-page">
      <div class="filter-row">
        <button
          v-for="f in filters"
          :key="f.type ?? 'all'"
          class="filter-btn"
          :class="{ active: activeFilter === f.type }"
          @click="setFilter(f.type ?? 'all')"
        >
          {{ f.label }}
        </button>
      </div>

      <div ref="scrollRef" class="log-scroll" @scroll="onScroll">
        <RoundedPanel
          v-for="entry in entries"
          :key="entry.day + '-' + entry.type + '-' + entry.title"
          class="log-entry"
          :class="'log-entry--' + entry.type"
        >
          <div class="entry-header">
            <span class="entry-title">{{ entry.title }}</span>
            <span class="entry-day">День {{ entry.day }}</span>
          </div>
          <p v-if="entry.description" class="entry-desc">{{ entry.description }}</p>
        </RoundedPanel>

        <RoundedPanel v-if="entries.length === 0" class="empty-panel">
          <p class="empty-text">Записей пока нет</p>
        </RoundedPanel>

        <div v-if="isLoading" class="loading">Загрузка…</div>
      </div>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GameLayout from '@/components/layout/GameLayout.vue'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import { useActivityLog } from '@/composables/useActivityLog'

const { entries, activeFilter, setFilter, loadMore } = useActivityLog()

const scrollRef = ref<HTMLElement | null>(null)
const isLoading = ref(false)

const filters = [
  { label: 'Все', type: null },
  { label: 'Действия', type: 'action' },
  { label: 'События', type: 'event' },
  { label: 'Финансы', type: 'finance' },
  { label: 'Карьера', type: 'career' },
  { label: 'Обучение', type: 'education' },
  { label: 'Навыки', type: 'skill_change' },
  { label: 'Время', type: 'time' },
]

function onScroll() {
  const el = scrollRef.value
  if (!el) return
  const threshold = 200
  if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
    isLoading.value = true
    loadMore()
    setTimeout(() => { isLoading.value = false }, 100)
  }
}
</script>

<style scoped>
.log-page{display:flex;flex-direction:column;gap:10px;height:100%}
.filter-row{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;flex-shrink:0}
.filter-btn{padding:6px 14px;border-radius:10px;border:1px solid var(--color-line);background:var(--color-panel);color:var(--color-text);font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit;transition:all .2s}
.filter-btn.active{background:var(--color-accent);color:#fff;border-color:var(--color-accent);font-weight:600}
.filter-btn:hover:not(.active){background:rgba(232,180,160,.1)}
.log-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-bottom:20px}
.log-entry{transition:all .2s}
.log-entry--action{background:rgba(245,237,230,.6)}
.log-entry--event{background:rgba(240,234,244,.6)}
.log-entry--finance{background:rgba(244,240,230,.6)}
.log-entry--career{background:rgba(234,240,244,.6)}
.log-entry--education{background:rgba(234,244,240,.6)}
.log-entry--time{background:rgba(242,239,234,.6)}
.entry-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.entry-title{font-size:14px;font-weight:600}
.entry-day{font-size:11px;color:var(--color-text);opacity:.5}
.entry-desc{font-size:12px;color:var(--color-text);opacity:.8;margin:4px 0 0;line-height:1.4}
.empty-panel{text-align:center;padding:24px}
.empty-text{font-size:14px;opacity:.6;margin:0}
.loading{text-align:center;font-size:12px;opacity:.5;padding:8px}
</style>

