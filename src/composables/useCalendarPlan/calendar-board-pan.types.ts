/** Снимок указателя в момент старта пана доски. */
export interface CalendarBoardPanStartInput {
  pointerType: string
  button: number
  isInsideBoard: boolean
  isInsideBlockedControl: boolean
}

/** Минимальное хранилище для подсказки пана. */
export interface CalendarBoardPanStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** Входные данные сглаживания скорости пана. */
export interface CalendarBoardVelocityBlendInput {
  previousVelocityPxPerMs: number
  deltaPx: number
  elapsedMs: number
  smoothing: number
}

/** Входные данные шага инерции доски. */
export interface CalendarBoardInertiaStepInput {
  scrollLeft: number
  velocityPxPerMs: number
  elapsedMs: number
  maxScrollLeft: number
  friction: number
  stopVelocity: number
}

/** Состояние доски после шага инерции. */
export interface CalendarBoardInertiaStep {
  scrollLeft: number
  velocityPxPerMs: number
  isStopped: boolean
}
