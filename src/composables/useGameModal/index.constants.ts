import type { GameModalButton } from './modal.types'
import { STAT_LABELS_RU, METRIC_LABELS } from '@constants/metric-labels'

/**
 * Кнопка по умолчанию для модалки результата
 */
export const DEFAULT_OK_BUTTON: GameModalButton = { label: 'Понятно', accent: true }

/**
 * Regex для парсинга строки эффекта вида «Энергия +32, Настроение -6»
 */
export const STAT_VALUE_PATTERN: RegExp = /([\wа-яё\s]+?)\s*([+-]\d+(?:\.\d+)?)/gi

/**
 * Обратный маппинг: русское название характеристики → английский ключ.
 * Строится из STAT_LABELS_RU и METRIC_LABELS, чтобы покрыть оба варианта
 * («Форма» из STAT_LABELS_RU и «Физическая форма» из METRIC_LABELS).
 */
function buildRuStatToKeyMap(): Readonly<Record<string, string>> {
  const map: Record<string, string> = {}

  const sources: ReadonlyArray<Readonly<Record<string, string>>> = [STAT_LABELS_RU, METRIC_LABELS]

  for (const source of sources) {
    for (const [key, ruLabel] of Object.entries(source)) {
      map[ruLabel] = key
    }
  }

  return Object.freeze(map)
}

export const RU_STAT_TO_KEY_MAP: Readonly<Record<string, string>> = buildRuStatToKeyMap()
