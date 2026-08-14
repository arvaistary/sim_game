import type {
  CalendarBoardInertiaStep,
  CalendarBoardInertiaStepInput,
  CalendarBoardPanStartInput,
  CalendarBoardPanStorage,
  CalendarBoardVelocityBlendInput,
} from './calendar-board-pan.types'

export type {
  CalendarBoardInertiaStep,
  CalendarBoardInertiaStepInput,
  CalendarBoardPanStartInput,
  CalendarBoardPanStorage,
  CalendarBoardVelocityBlendInput,
} from './calendar-board-pan.types'

/** Селектор элементов, с которых пан доски не стартует. */
export const CALENDAR_BOARD_PAN_BLOCKED_SELECTOR: string = '.calendar-action-card, .tooltip-wrapper, a, button, input, textarea, select, [role="button"]'

/** Ключ localStorage для разовой подсказки пана. */
export const CALENDAR_BOARD_PAN_HINT_KEY: string = 'gl_calendar_board_pan_hint_dismissed'

/** Коэффициент трения за кадр 16.67 мс: доска выбегает, а не встаёт скачком. */
export const CALENDAR_BOARD_PAN_FRICTION: number = 0.92

/** Порог остановки инерции, px/мс. */
export const CALENDAR_BOARD_PAN_STOP_VELOCITY: number = 0.02

/** Доля мгновенной выборки в сглаженной скорости. */
export const CALENDAR_BOARD_PAN_VELOCITY_SMOOTHING: number = 0.35

const FRAME_MS: number = 16.67

/**
 * Разрешает пан доски только с пустой области по основной кнопке мыши.
 * @description [Composable] - отделяет пан колонок от HTML5-переноса карточек и нативного свайпа.
 * @return { boolean } true, если жест должен скроллить доску
 */
export function canStartCalendarBoardPan(input: CalendarBoardPanStartInput): boolean {
  if (input.pointerType !== 'mouse') return false

  if (input.button !== 0) return false

  if (!input.isInsideBoard) return false

  return !input.isInsideBlockedControl
}

/**
 * Показывает, нужно ли вывести подсказку пана.
 * @description [Composable] - читает флаг dismiss из переданного хранилища.
 * @return { boolean } true, если подсказка ещё не закрыта
 */
export function isCalendarBoardPanHintVisible(storage: CalendarBoardPanStorage): boolean {
  return storage.getItem(CALENDAR_BOARD_PAN_HINT_KEY) !== '1'
}

/**
 * Скрывает подсказку пана доски.
 * @description [Composable] - записывает флаг dismiss в переданное хранилище.
 * @return { void }
 */
export function dismissCalendarBoardPanHint(storage: CalendarBoardPanStorage): void {
  storage.setItem(CALENDAR_BOARD_PAN_HINT_KEY, '1')
}

/**
 * Сглаживает скорость пана по соседним выборкам указателя.
 * @description [Composable] - не даёт одиночному кадру дёрнуть инерцию.
 * @return { number } скорость scrollLeft в px/мс
 */
export function blendCalendarBoardPanVelocity(input: CalendarBoardVelocityBlendInput): number {
  if (input.elapsedMs <= 0) return input.previousVelocityPxPerMs

  const instantVelocity: number = input.deltaPx / input.elapsedMs

  return input.previousVelocityPxPerMs * (1 - input.smoothing) + instantVelocity * input.smoothing
}

/**
 * Сдвигает доску на один кадр инерции без привязки к колонкам.
 * @description [Composable] - freeMode: затухание скорости и остановка на краю диапазона.
 * @return { CalendarBoardInertiaStep } новое положение, скорость и флаг остановки
 */
export function stepCalendarBoardInertia(input: CalendarBoardInertiaStepInput): CalendarBoardInertiaStep {
  const dampedVelocity: number = input.velocityPxPerMs * (input.friction ** (input.elapsedMs / FRAME_MS))
  const unclampedScroll: number = input.scrollLeft + dampedVelocity * input.elapsedMs
  const nextScroll: number = Math.min(input.maxScrollLeft, Math.max(0, unclampedScroll))
  const hitEdge: boolean = nextScroll <= 0 || nextScroll >= input.maxScrollLeft

  if (hitEdge) {
    return {
      scrollLeft: nextScroll,
      velocityPxPerMs: 0,
      isStopped: true,
    }
  }

  return {
    scrollLeft: nextScroll,
    velocityPxPerMs: dampedVelocity,
    isStopped: Math.abs(dampedVelocity) < input.stopVelocity,
  }
}
