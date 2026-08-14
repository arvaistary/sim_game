<template>
  <GameLayout title="Календарь">
    <div class="day-plan-page">
      <SectionHeader title="Собери период" :subtitle="`Открыто дней: ${horizon} из 7. Прогноз не учитывает случайные события.`" />

      <p
        v-if="showPanHint"
        class="calendar-board-hint"
        role="status"
      >
        <span>Потяните доску, чтобы увидеть остальные дни</span>
        <button
          type="button"
          class="calendar-board-hint__dismiss"
          @click="dismissPanHint"
        >Понятно</button>
      </p>

      <div
        ref="boardRef"
        :class="['calendar-board', {
          'calendar-board--panning': isBoardPanning,
          'calendar-board--coasting': isBoardCoasting,
        }]"
        @pointerdown="handleBoardPointerDown"
        @pointermove="handleBoardPointerMove"
        @pointerup="handleBoardPointerUp"
        @pointercancel="handleBoardPointerUp"
        @click.capture="handleBoardClickCapture"
      >
        <template v-for="day in boardDays" :key="day.dayOffset">
          <article
            :class="['calendar-day', {
              'calendar-day--locked': day.isLocked,
              'calendar-day--drop-target': dragOverDay === day.dayOffset,
            }]"
            :style="{ gridColumn: day.dayOffset + 1, gridRow: 1, '--calendar-day-index': day.dayOffset }"
            @dragover.prevent="handleDragOver(day.dayOffset, $event)"
            @drop.prevent="dropAction(day.dayOffset)"
          >
            <header class="calendar-day__header">
              <div class="calendar-day__heading">
                <p class="calendar-day__eyebrow">День {{ day.dayOffset + 1 }}</p>
                <h2 :title="getWeekdayFullLabel(day.dayOffset)">{{ day.weekday }}</h2>
              </div>
              <span v-if="day.isLocked" class="calendar-day__lock-badge" aria-hidden="true">
                <svg class="calendar-day__icon" viewBox="0 0 24 24">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
              <span v-else class="calendar-day__budget">{{ formatHours(dayHours(day)) }} ч</span>
            </header>
            <div v-if="day.isLocked" class="calendar-day__locked-content">
              <strong>{{ day.lockCopy.title }}</strong>
              <span>{{ day.lockCopy.requirement }}</span>
              <span>{{ day.lockCopy.progress }}</span>
              <NuxtLink :to="skillsRoute" class="calendar-day__skills-link">Открыть навыки</NuxtLink>
            </div>
            <ul v-else class="calendar-day__actions" aria-label="Запланированные действия">
              <li
                class="calendar-action-card calendar-action-card--sleep"
                :class="{ 'calendar-action-card--sleep-disabled': day.plan.sleepHours === 0 }"
              >
                <div class="calendar-action-card__body">
                  <span class="calendar-action-card__category calendar-action-card__category--sleep">🌙 Восстановление</span>
                  <strong class="calendar-action-card__title">{{ day.plan.sleepHours > 0 ? 'Сон' : 'Без сна' }}</strong>
                  <span class="calendar-action-card__meta">{{ formatHours(day.plan.sleepHours) }} ч</span>
                </div>
                <div class="calendar-action-card__controls">
                  <Tooltip :text="day.plan.sleepHours > 0 ? 'Убрать сон' : 'Добавить сон на 7 часов'">
                    <button
                      type="button"
                      class="calendar-action-card__button"
                      :aria-label="day.plan.sleepHours > 0 ? 'Убрать сон' : 'Добавить нормальный сон'"
                      @click.stop="setSleepHours(day.dayOffset, day.plan.sleepHours > 0 ? 0 : 7)"
                    >
                      <svg v-if="day.plan.sleepHours > 0" class="calendar-action-card__icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                      <svg v-else class="calendar-action-card__icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    </button>
                  </Tooltip>
                </div>
              </li>
              <li
                v-for="(actionId, actionIndex) in day.plan.actionIds"
                :key="`${actionId}-${actionIndex}`"
                :class="['calendar-action-card', { 'calendar-action-card--pinned': isPinned(day, actionIndex) }]"
                draggable="true"
                @dragstart="startDragging(day.dayOffset, actionIndex, $event)"
                @dragend="endDragging"
              >
                <div class="calendar-action-card__body">
                  <span
                    :class="[
                      'calendar-action-card__category',
                      `calendar-action-card__category--${getActionCategory(actionId).key}`,
                    ]"
                  >
                    {{ getActionCategory(actionId).icon }} {{ getActionCategory(actionId).label }}
                  </span>
                  <strong class="calendar-action-card__title">{{ getActionTitle(actionId) }}</strong>
                  <span class="calendar-action-card__meta">{{ getActionHours(actionId) }} ч</span>
                </div>
                <div class="calendar-action-card__controls">
                  <Tooltip :text="isPinned(day, actionIndex) ? 'Открепить' : 'Закрепить'">
                    <button
                      type="button"
                      class="calendar-action-card__button"
                      :class="{ 'calendar-action-card__button--active': isPinned(day, actionIndex) }"
                      :aria-label="`${isPinned(day, actionIndex) ? 'Открепить' : 'Закрепить'} действие: ${getActionTitle(actionId)}`"
                      :aria-pressed="isPinned(day, actionIndex)"
                      @click.stop="togglePin(day.dayOffset, actionIndex)"
                    >
                      <svg class="calendar-action-card__icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 17v5" />
                        <path d="M9 10.76A2 2 0 0 1 7.89 8.63l.53-3.16A2 2 0 0 1 10.38 4h3.24a2 2 0 0 1 1.96 1.47l.53 3.16A2 2 0 0 1 15 10.76V13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
                      </svg>
                    </button>
                  </Tooltip>
                  <Tooltip text="Удалить">
                    <button
                      type="button"
                      class="calendar-action-card__button"
                      :aria-label="`Удалить действие: ${getActionTitle(actionId)}`"
                      @click.stop="removeAction(day.dayOffset, actionIndex)"
                    >
                      <svg class="calendar-action-card__icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </Tooltip>
                  <Tooltip text="Дублировать ниже">
                    <button
                      type="button"
                      class="calendar-action-card__button"
                      :aria-label="`Дублировать действие: ${getActionTitle(actionId)}`"
                      @click.stop="duplicateAction(day.dayOffset, actionIndex)"
                    >
                      <svg class="calendar-action-card__icon" viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  </Tooltip>
                </div>
              </li>
            </ul>
          </article>
          <section
            v-if="forecastByDay[day.dayOffset]"
            class="calendar-day-forecast"
            :style="{ gridColumn: day.dayOffset + 1, gridRow: 2, '--calendar-day-index': day.dayOffset }"
            :aria-label="`Прогноз ${getWeekdayFullLabel(day.dayOffset)}`"
          >
            <StatBar
              v-for="stat in statDefs"
              :key="stat.key"
              :label="stat.label"
              :value="getForecastStatValue(forecastByDay[day.dayOffset]!, stat.key)"
              :delta="getForecastStatDelta(forecastByDay[day.dayOffset]!, stat.key)"
              :color="stat.endColor"
              :alert="getForecastStatAlert(forecastByDay[day.dayOffset]!, stat.key)"
            />
          </section>
        </template>
      </div>

      <div class="calendar-footer">
        <p
          v-if="runMessage"
          :class="['calendar-footer__message', `calendar-footer__message--${runMessageTone}`]"
          :role="runMessageTone === 'error' ? 'alert' : 'status'"
          :aria-live="runMessageTone === 'error' ? 'assertive' : 'polite'"
        >{{ runMessage }}</p>
        <GameButton label="Прожить период" :disabled="isRunning" @click="runPeriod" />
      </div>
    </div>
  </GameLayout>
</template>

<script setup lang="ts">
import StatBar from '@/components/game/StatBar/StatBar.vue'
import Tooltip from '@/components/ui/Tooltip/index.vue'

import { useCalendarPlan } from '@/composables/useCalendarPlan'
import {
  CALENDAR_BOARD_PAN_BLOCKED_SELECTOR,
  CALENDAR_BOARD_PAN_FRICTION,
  CALENDAR_BOARD_PAN_STOP_VELOCITY,
  CALENDAR_BOARD_PAN_VELOCITY_SMOOTHING,
  blendCalendarBoardPanVelocity,
  canStartCalendarBoardPan,
  dismissCalendarBoardPanHint,
  isCalendarBoardPanHintVisible,
  stepCalendarBoardInertia,
} from '@/composables/useCalendarPlan/calendar-board-pan'
import type { CalendarBoardInertiaStep, CalendarBoardPanStartInput } from '@/composables/useCalendarPlan/calendar-board-pan.types'

import { ROUTE_MAP } from '@/constants/navigation'

import './plan.scss'

definePageMeta({ middleware: 'game-init' })

const {
  horizon,
  boardDays,
  forecastByDay,
  statDefs,
  isRunning,
  runMessage,
  runMessageTone,
  dragOverDay,
  getActionTitle,
  getActionCategory,
  getActionHours,
  isPinned,
  getWeekdayFullLabel,
  dayHours,
  formatHours,
  getForecastStatValue,
  getForecastStatDelta,
  getForecastStatAlert,
  removeAction,
  setSleepHours,
  togglePin,
  duplicateAction,
  startDragging,
  handleDragOver,
  dropAction,
  endDragging,
  runPeriod,
} = useCalendarPlan()

const PAN_CLICK_SUPPRESS_PX: number = 4
const skillsRoute: string = ROUTE_MAP.skills ?? '/game/skills'

const boardRef = ref<HTMLElement | null>(null)
const isBoardPanning = ref<boolean>(false)
const isBoardCoasting = ref<boolean>(false)
const showPanHint = ref<boolean>(false)
const panOriginX = ref<number>(0)
const panOriginScroll = ref<number>(0)
const panMovedPx = ref<number>(0)
const shouldSuppressClick = ref<boolean>(false)
let wheelTarget: HTMLElement | null = null
let panVelocityPxPerMs: number = 0
let lastPointerX: number = 0
let lastPointerTime: number = 0
let inertiaFrameId: number = 0
let lastInertiaTime: number = 0

function readPanStartInput(event: PointerEvent): CalendarBoardPanStartInput {
  const target: EventTarget | null = event.target

  if (!(target instanceof Element)) {
    return {
      pointerType: event.pointerType,
      button: event.button,
      isInsideBoard: false,
      isInsideBlockedControl: false,
    }
  }

  return {
    pointerType: event.pointerType,
    button: event.button,
    isInsideBoard: target.closest('.calendar-board') !== null,
    isInsideBlockedControl: target.closest(CALENDAR_BOARD_PAN_BLOCKED_SELECTOR) !== null,
  }
}

function stopBoardInertia(): void {
  if (inertiaFrameId !== 0) {
    cancelAnimationFrame(inertiaFrameId)
    inertiaFrameId = 0
  }

  isBoardCoasting.value = false
  lastInertiaTime = 0
}

function runBoardInertia(timestamp: number): void {
  const board: HTMLElement | null = boardRef.value

  if (!board) {
    stopBoardInertia()
    return
  }

  if (lastInertiaTime === 0) {
    lastInertiaTime = timestamp
  }

  const elapsedMs: number = Math.max(0, timestamp - lastInertiaTime)
  lastInertiaTime = timestamp

  const maxScrollLeft: number = Math.max(0, board.scrollWidth - board.clientWidth)
  const step: CalendarBoardInertiaStep = stepCalendarBoardInertia({
    scrollLeft: board.scrollLeft,
    velocityPxPerMs: panVelocityPxPerMs,
    elapsedMs,
    maxScrollLeft,
    friction: CALENDAR_BOARD_PAN_FRICTION,
    stopVelocity: CALENDAR_BOARD_PAN_STOP_VELOCITY,
  })

  board.scrollLeft = step.scrollLeft
  panVelocityPxPerMs = step.velocityPxPerMs

  if (step.isStopped) {
    stopBoardInertia()
    return
  }

  inertiaFrameId = requestAnimationFrame(runBoardInertia)
}

function startBoardInertia(): void {
  const reduceMotion: boolean = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduceMotion || Math.abs(panVelocityPxPerMs) < CALENDAR_BOARD_PAN_STOP_VELOCITY) {
    stopBoardInertia()
    panVelocityPxPerMs = 0
    return
  }

  isBoardCoasting.value = true
  lastInertiaTime = 0
  inertiaFrameId = requestAnimationFrame(runBoardInertia)
}

function handleBoardPointerDown(event: PointerEvent): void {
  const board: HTMLElement | null = boardRef.value

  if (!board) return

  if (!canStartCalendarBoardPan(readPanStartInput(event))) return

  stopBoardInertia()
  isBoardPanning.value = true
  panOriginX.value = event.clientX
  panOriginScroll.value = board.scrollLeft
  panMovedPx.value = 0
  panVelocityPxPerMs = 0
  lastPointerX = event.clientX
  lastPointerTime = event.timeStamp
  board.setPointerCapture(event.pointerId)
}

function handleBoardPointerMove(event: PointerEvent): void {
  const board: HTMLElement | null = boardRef.value

  if (!isBoardPanning.value || !board) return

  const delta: number = event.clientX - panOriginX.value
  const elapsedMs: number = event.timeStamp - lastPointerTime

  panMovedPx.value = Math.abs(delta)
  panVelocityPxPerMs = blendCalendarBoardPanVelocity({
    previousVelocityPxPerMs: panVelocityPxPerMs,
    deltaPx: lastPointerX - event.clientX,
    elapsedMs,
    smoothing: CALENDAR_BOARD_PAN_VELOCITY_SMOOTHING,
  })
  lastPointerX = event.clientX
  lastPointerTime = event.timeStamp
  board.scrollLeft = panOriginScroll.value - delta
}

function handleBoardPointerUp(): void {
  if (panMovedPx.value >= PAN_CLICK_SUPPRESS_PX) {
    shouldSuppressClick.value = true
  }

  isBoardPanning.value = false
  panMovedPx.value = 0
  startBoardInertia()
}

function handleBoardClickCapture(event: MouseEvent): void {
  if (!shouldSuppressClick.value) return

  event.preventDefault()
  event.stopPropagation()
  shouldSuppressClick.value = false
}

function dismissPanHint(): void {
  dismissCalendarBoardPanHint(window.localStorage)
  showPanHint.value = false
}

function handleBoardWheel(event: WheelEvent): void {
  const board: HTMLElement | null = boardRef.value

  if (!board) return

  if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return

  if (event.deltaY === 0) return

  event.preventDefault()
  stopBoardInertia()
  panVelocityPxPerMs = blendCalendarBoardPanVelocity({
    previousVelocityPxPerMs: panVelocityPxPerMs,
    deltaPx: event.deltaY,
    elapsedMs: 16.67,
    smoothing: CALENDAR_BOARD_PAN_VELOCITY_SMOOTHING,
  })
  board.scrollLeft += event.deltaY
  startBoardInertia()
}

onMounted(() => {
  showPanHint.value = isCalendarBoardPanHintVisible(window.localStorage)
  const board: HTMLElement | null = boardRef.value

  if (!board) return

  wheelTarget = board
  board.addEventListener('wheel', handleBoardWheel, { passive: false })
})

onUnmounted(() => {
  stopBoardInertia()
  wheelTarget?.removeEventListener('wheel', handleBoardWheel)
})
</script>
