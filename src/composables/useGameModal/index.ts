import { ref } from 'vue'
import type { StatChangeBreakdownEntry } from '@/domain/balance/types'
import { buildActionResultStatLines, type ActionResultStatLine } from '@/utils/stat-breakdown-format'

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

interface GameModalState extends GameModalOptions {
  isOpen: boolean
  baseStatValues: Record<string, number>
  actionResultMeta: string
  actionResultLines: ActionResultStatLine[]
}

const state = ref<GameModalState>({
  isOpen: false,
  title: '',
  message: '',
  lines: [],
  baseStatValues: {},
  actionResultMeta: '',
  actionResultLines: [],
  buttons: [],
})

/**
 * Единая система модальных окон.
 *
 * @example
 * ```ts
 * const { show, close } = useGameModal()
 *
 * show({
 *   title: 'Нет работы',
 *   lines: ['У вас пока нет работы.', 'Сначала устройтесь на работу.'],
 *   buttons: [
 *     { label: 'Найти работу', route: '/game/career', accent: true },
 *   ],
 * })
 * ```
 */
export function useGameModal() {
  function show(options: GameModalOptions): void {
    state.value = {
      isOpen: true,
      title: options.title,
      message: options.message ?? '',
      lines: options.lines ?? [],
      baseStatValues: options.baseStatValues ?? {},
      actionResultMeta: options.actionResultMeta ?? '',
      actionResultLines: options.actionResultLines ?? [],
      buttons: options.buttons ?? [],
    }
  }

  function close(): void {
    state.value = {
      ...state.value,
      isOpen: false,
      baseStatValues: {},
      actionResultMeta: '',
      actionResultLines: [],
    }
  }

  return {
    state,
    show,
    close,
  }
}

const defaultOkButton: GameModalButton = { label: 'Понятно', accent: true }

/**
 * Парсит строку эффекта и извлекает базовые значения характеристик
 * Формат: "Энергия +32, Настроение +6, Стресс -9"
 */
function parseBaseStatValues(effectText: string): Record<string, number> {
  const result: Record<string, number> = {}
  if (!effectText) return result

  const reverseMap: Record<string, string> = {
    Энергия: 'energy',
    Голод: 'hunger',
    Стресс: 'stress',
    Настроение: 'mood',
    Здоровье: 'health',
    Форма: 'physical',
    'Физическая форма': 'physical',
  }

  const pattern = /([\wа-яё\s]+?)\s*([+-]\d+(?:\.\d+)?)/gi
  let match

  while ((match = pattern.exec(effectText)) !== null) {
    const [, nameRaw, valueRaw] = match
    const name = nameRaw.trim()
    const value = parseFloat(valueRaw)

    const key = reverseMap[name] ?? name.toLowerCase()
    result[key] = value
  }

  return result
}

export interface ShowGameResultModalExtra {
  /** Для вызовов без statBreakdown (финансы, обучение): парсинг «базы» из строки эффекта */
  baseEffect?: string
  /** Разбор из движка — приоритетнее baseEffect */
  statBreakdown?: StatChangeBreakdownEntry[]
  hourCost?: number
  price?: number
}

/**
 * Модальное окно с результатом действия или покупки (единый формат для игры).
 */
export function showGameResultModal(title: string, detail: string, extra?: ShowGameResultModalExtra): void {
  const { show } = useGameModal()
  const lines = detail.split(/\r?\n/).map(s => s.trim()).filter(Boolean)

  if (extra?.statBreakdown && extra.statBreakdown.length > 0) {
    const actionResultLines = buildActionResultStatLines(extra.statBreakdown)
    const metaParts: string[] = []
    if (extra.hourCost) metaParts.push(`время ${extra.hourCost}ч`)
    if (extra.price) metaParts.push(`деньги -${extra.price}`)
    show({
      title,
      lines: [],
      message: '',
      baseStatValues: {},
      actionResultMeta: metaParts.join(' • '),
      actionResultLines,
      buttons: [defaultOkButton],
    })
    return
  }

  const baseStatValues = extra?.baseEffect ? parseBaseStatValues(extra.baseEffect) : {}
  show({
    title,
    lines: lines.length > 0 ? lines : ['Готово.'],
    message: '',
    baseStatValues,
    actionResultMeta: '',
    actionResultLines: [],
    buttons: [defaultOkButton],
  })
}
