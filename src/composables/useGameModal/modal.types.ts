import type { Component } from 'vue'
import type { StatChangeBreakdownEntry } from '@domain/balance/types'
import type { ActionResultStatLine } from '@utils/stat-breakdown-format.types'
/**
 * Унифицированный интерфейс для модальных окон
 */

/**
 * Описание кнопки в модальном окне.
 * Если указан `route` — при клике выполняется навигация.
 * Если указан `action` — вызывается произвольный колбэк.
 */
export interface GameModalButton {
  label: string
  /** Путь для навигации (например, '/game/career') */
  route?: string
  action?: () => void
  accent?: boolean
}

/**
 * Базовые пропсы для всех модальных окон в стеке
 */
export interface BaseModalProps {
  /** Callback для закрытия модального окна */
  onClose?: () => void
}

/**
 * Опции для открытия модального окна через стек
 */
export interface OpenModalOptions {
  /** Дополнительные пропсы для передачи в компонент */
  props?: Record<string, unknown>
  /** Callback, который будет вызван при закрытии */
  onClose?: () => void
}

/**
 * Тип для компонента модального окна
 */
export type ModalComponent = Component

/**
 * Объединяет базовые пропсы с пользовательскими
 */
export type ModalProps<T extends BaseModalProps = BaseModalProps> = T

/**
 * Конфигурация модального окна, открываемого через useGameModal().
 */
export interface GameModalOptions {
  /** Заголовок модального окна */
  title: string
  /** Текст сообщения (поддерживает HTML-разметку не будет, только текст) */
  message?: string
  /** Массив строк-абзацев — каждый отрендерится отдельным <p> */
  lines?: string[]
  /** Базовые значения характеристик (до применения модификаторов) — устаревший путь без statBreakdown */
  baseStatValues?: Record<string, number>
  /** Строка над ними: время, деньги */
  actionResultMeta?: string
  /** Результат действия с разбором формулы (вместо парсинга lines) */
  actionResultLines?: ActionResultStatLine[]
  /** Кнопки действий */
  buttons?: GameModalButton[]
}

/**
 * Внутреннее состояние useGameModal().
 */
export interface GameModalState extends GameModalOptions {
  isOpen: boolean
  baseStatValues: Record<string, number>
  actionResultMeta: string
  actionResultLines: ActionResultStatLine[]
}

/**
 * Дополнительные параметры для showGameResultModal().
 */
export interface ShowGameResultModalExtra {
  /** Для вызовов без statBreakdown (финансы, обучение): парсинг «базы» из строки эффекта */
  baseEffect?: string
  /** Разбор из движка — приоритетнее baseEffect */
  statBreakdown?: StatChangeBreakdownEntry[]
  hourCost?: number
  price?: number
}
