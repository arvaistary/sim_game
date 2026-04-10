<template>
  <div class="main-page">
    <!-- ===== Top Row: Profile | Log | Stats ===== -->
    <div class="top-row">
      <!-- Profile Card -->
      <RoundedPanel class="card profile-card" padding="18px">
        <h1 class="profile-name">{{ playerName }}</h1>
        <p class="profile-job">{{ jobLabel }}</p>
        <p class="profile-money">{{ formatMoney(money) }} ₽</p>
        <p class="profile-time">{{ timeLabel }}</p>
        <p class="profile-comfort">Комфорт: {{ Math.round(comfort) }}</p>
        <div class="profile-buttons">
          <GameButton label="Карьера" small @click="navigateToRoute('/game/career')" />
          <GameButton label="Мои навыки" small @click="navigateToRoute('/game/skills')" />
        </div>
      </RoundedPanel>

      <!-- Activity Log Card -->
      <div class="log-card-wrapper" @click="navigateToRoute('/game/activity')">
        <RoundedPanel class="card log-card" padding="14px">
          <h3 class="card-title">📋 Последние события</h3>
          <div class="log-entries">
            <p v-if="logEntries.length === 0" class="log-empty">Пока нет записей</p>
            <p
              v-for="(entry, i) in logEntries"
              :key="i"
              class="log-entry"
            >
              {{ entry.icon || '•' }} {{ entry.displayTitle }} · д{{ entry.day }}
            </p>
          </div>
          <p class="log-hint">Нажмите для подробностей →</p>
        </RoundedPanel>
      </div>

      <!-- Stats Card -->
      <RoundedPanel class="card scales-card" padding="16px">
        <h3 class="card-title">Состояние персонажа</h3>
        <div class="stat-bars">
          <StatBar
            v-for="stat in statDefs"
            :key="stat.key"
            :label="stat.label"
            :value="getStatValue(stat.key)"
            :color="stat.endColor"
          />
        </div>
      </RoundedPanel>
    </div>

    <!-- ===== Home Preview ===== -->
    <RoundedPanel class="card home-preview" padding="16px">
      <h3 class="card-title">Интерьер дома</h3>
      <div class="home-preview-image">
        <img src="/image/home_interier_0.gif" alt="Интерьер дома" />
      </div>
    </RoundedPanel>

    <!-- ===== Action Button ===== -->
    <div class="action-section">
      <button class="action-button" @click="handleWorkClick">
        <span class="action-button__label">Пойти на работу</span>
        <span class="action-button__subtitle">обменять своё здоровье на деньги</span>
      </button>
    </div>

    <!-- ===== Navigation ===== -->
    <nav class="nav-wrapper">
      <RoundedPanel padding="8px" :radius="18">
        <div class="nav-grid">
          <button
            v-for="item in navItems"
            :key="item.id"
            class="nav-item"
            @click="handleNavClick(item)"
          >
            <span
              class="nav-dot"
              :class="{ 'nav-dot--active': item.id === 'home' }"
            >{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </div>
      </RoundedPanel>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { navigateTo } from '#imports'
import { useGameStore } from '@/stores/game.store'
import RoundedPanel from '@/components/ui/RoundedPanel.vue'
import GameButton from '@/components/ui/GameButton.vue'
import StatBar from '@/components/game/StatBar.vue'
import { STAT_DEFS, NAV_ITEMS } from '@/shared/constants/index'
import { resolveActivityLogTitle } from '@/shared/utils'

const store = useGameStore()

// ===== Data =====
const playerName = computed(() => store.playerName)
const money = computed(() => store.money)
const comfort = computed(() => store.comfort)
const statDefs = STAT_DEFS
const navItems = NAV_ITEMS

// Job label with weekly hours info
const jobLabel = computed(() => {
  const career = store.career
  if (!career?.currentJob) return 'Безработный'
  const job = career.currentJob as any
  const baseLabel = job.name || 'Безработный'
  const required = Math.max(0, Number(job.requiredHoursPerWeek) || 0)
  const worked = Math.max(0, Number(job.workedHoursCurrentWeek) || 0)
  if (required <= 0) return baseLabel
  const remaining = Math.max(0, required - worked)
  const status = remaining > 0
    ? `ещё ${remaining} ч до нормы`
    : 'норма закрыта'
  return `${baseLabel} • ${worked}/${required} ч (${status})`
})

// Time label
const timeLabel = computed(() => {
  const t = store.time as unknown as Record<string, unknown> | null
  if (!t) return 'День 1 • Неделя 1 (168 ч. осталось) • 18 лет'
  const gameDays = (t?.gameDays as number) || 1
  const gameWeeks = (t?.gameWeeks as number) || 1
  const weekHoursRemaining = (t?.weekHoursRemaining as number) ?? 168
  const currentAge = (t?.currentAge as number) || (t?.age as number) || 18
  return `День ${gameDays} • Неделя ${gameWeeks} (${weekHoursRemaining} ч. осталось) • ${currentAge} лет`
})

// Activity log entries
interface LogEntryDisplay {
  icon: string
  displayTitle: string
  day: string | number
}
const logEntries = ref<LogEntryDisplay[]>([])

function refreshActivityLog() {
  const entries = store.getActivityLogEntries(8)
  if (!entries || entries.length === 0) {
    logEntries.value = []
    return
  }
  logEntries.value = entries.map((entry: any) => {
    const displayTitle = resolveActivityLogTitle(entry)
    const title = displayTitle.length > 28
      ? displayTitle.substring(0, 25) + '…'
      : displayTitle
    return {
      icon: entry.icon || '•',
      displayTitle: title,
      day: entry.timestamp?.day ?? '?',
    }
  })
}

// ===== Methods =====
function getStatValue(key: string): number {
  if (!store.stats) return 50
  return (store.stats as any)[key] ?? 50
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

function handleWorkClick() {
  navigateToRoute('/game/career')
}

function handleNavClick(item: { id: string }) {
  const routeMap: Record<string, string> = {
    home: '/game/home',
    shop: '/game/shop',
    fun: '/game/recovery',
    education: '/game/education',
    skills: '/game/skills',
    social: '/game/social',
    finance: '/game/finance',
    hobby: '/game/hobby',
    health: '/game/health',
    selfdev: '/game/selfdev',
    activityLog: '/game/activity',
  }
  const route = routeMap[item.id]
  if (route) {
    navigateToRoute(route)
  }
}

function navigateToRoute(path: string) {
  navigateTo(path)
}

// ===== Lifecycle =====
onMounted(() => {
  refreshActivityLog()
})
</script>

<style scoped>
/* ===== Page Layout ===== */
.main-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  overflow: hidden;
}

/* ===== Top Row: 3-column desktop / stacked mobile ===== */
.top-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  flex-shrink: 0;
}

/* Mobile: profile full width, then log+scales side by side */
@media (max-width: 959px) {
  .main-page {
    overflow-y: auto;
    padding: 12px;
    gap: 10px;
  }
  .top-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .profile-card {
    width: 100%;
  }
  .log-card-wrapper {
    width: calc(50% - 5px);
  }
  .scales-card {
    width: calc(50% - 5px);
  }
}

/* ===== Card shared ===== */
.card {
  position: relative;
}

/* ===== Profile Card ===== */
.profile-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.profile-job {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  opacity: 0.75;
  line-height: 1.3;
}

.profile-money {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text);
  margin-top: 4px;
}

.profile-time {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  opacity: 0.7;
  line-height: 1.4;
}

.profile-comfort {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  opacity: 0.7;
}

.profile-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 8px;
}

/* ===== Activity Log Card ===== */
.log-card-wrapper {
  cursor: pointer;
}

.log-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.log-entries {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.log-empty {
  font-size: 13px;
  color: var(--color-text);
  opacity: 0.5;
  font-style: italic;
}

.log-entry {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-hint {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text);
  opacity: 0.5;
  text-align: center;
  margin-top: auto;
  padding-top: 4px;
}

/* ===== Stats Card ===== */
.scales-card {
  display: flex;
  flex-direction: column;
}

.stat-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

/* ===== Home Preview ===== */
.home-preview {
  flex: 1;
  min-height: 72px;
  display: flex;
  flex-direction: column;
}

.home-preview-image {
  flex: 1;
  min-height: 48px;
  border-radius: 12px;
  overflow: hidden;
  background: #f2ece3;
  border: 1px solid var(--color-line);
}

.home-preview-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center bottom;
}

/* ===== Action Button ===== */
.action-section {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 560px;
  min-height: 72px;
  padding: 14px 24px;
  border: none;
  border-radius: var(--radius-button);
  background-color: var(--color-accent);
  color: var(--color-text);
  font-family: var(--font-main);
  cursor: pointer;
  box-shadow: var(--shadow-button);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(60, 47, 47, 0.12);
}

.action-button:active {
  transform: translateY(0);
}

.action-button__label {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.action-button__subtitle {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.7;
  margin-top: 2px;
}

/* ===== Navigation ===== */
.nav-wrapper {
  flex-shrink: 0;
}

.nav-grid {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 2px;
  transition: transform var(--transition-fast);
}

.nav-item:hover {
  transform: translateY(-2px);
}

.nav-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: var(--color-accent-soft);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  transition: background-color var(--transition-fast);
}

.nav-dot--active {
  background-color: var(--color-accent);
}

.nav-item:hover .nav-dot {
  background-color: var(--color-accent);
}

.nav-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text);
}

/* ===== Responsive: tablet ===== */
@media (max-width: 959px) {
  .profile-name {
    font-size: 22px;
  }
  .profile-money {
    font-size: 20px;
  }
  .profile-job {
    font-size: 13px;
  }
  .profile-time {
    font-size: 13px;
  }
  .profile-comfort {
    font-size: 13px;
  }
  .profile-buttons {
    padding-top: 4px;
  }
  .action-button {
    min-height: 60px;
    padding: 10px 20px;
  }
  .action-button__label {
    font-size: 18px;
  }
  .action-button__subtitle {
    font-size: 12px;
  }
  .home-preview {
    min-height: 60px;
  }
}

/* ===== Responsive: small mobile ===== */
@media (max-width: 640px) {
  .nav-dot {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  .nav-label {
    font-size: 9px;
  }
}
</style>

