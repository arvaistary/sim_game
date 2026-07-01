import type { Ref } from 'vue'
import { buildActionResultStatLines, type ActionResultStatLine } from '@/utils/stat-breakdown-format'
import { useModalStack } from '../useModalStack'
import type {
  GameModalButton,
  GameModalOptions,
  GameModalState,
  OpenModalOptions,
  ShowGameResultModalExtra,
} from './modal.types'

export type {
  GameModalButton,
  GameModalOptions,
  ShowGameResultModalExtra,
} from './modal.types'

// Сохраняем state для обратной совместимости с GameModalHost
const state: Ref<GameModalState> = ref<GameModalState>({
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
 * Единая система модальных окон (state-based).
 * @description [Composable] - предоставляет методы show/close для управления состоянием модального окна.
 * @return { object } реактивное состояние и методы show/close
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

/**
 * Открыть модальное окно через стек (унифицированный подход).
 *
 * Автоматически добавляет проп `onClose` в переданные props, если он указан в options.
 *
 * @description [Composable] - открывает компонент в стеке модалок с поддержкой двух форматов вызова.
 * @return { symbol } уникальный ID модального окна
 *
 * @example
 * ```ts
 * import { openModal } from '@/composables/useGameModal'
 * import MyModal from '@/components/MyModal.vue'
 *
 * // Простой способ - передаем props напрямую
 * const modalId = openModal(MyModal, { title: 'Hello' })
 *
 * // С callback закрытия
 * const modalId = openModal(MyModal, {
 *   title: 'Hello',
 *   onClose: () => console.log('Closed')
 * })
 *
 * // Или через options
 * const modalId = openModal(MyModal, {
 *   props: { title: 'Hello' },
 *   onClose: () => console.log('Closed')
 * })
 * ```
 */
export function openModal(
  component: Component,
  options?: OpenModalOptions | Record<string, unknown>
): symbol {
  const modalStack = useModalStack()

  // Поддержка обоих форматов вызова:
  // 1. openModal(Component, { props: {...}, onClose: ... })
  // 2. openModal(Component, { title: '...', onClose: ... })

  let props: Record<string, unknown> = {}
  let onClose: (() => void) | undefined

  if (options) {
    if ('props' in options && typeof options.props === 'object') {
      props = { ...options.props }
      onClose = options.onClose as (() => void) | undefined
    } else {
      props = { ...options }

      if ('onClose' in props && typeof props.onClose === 'function') {
        onClose = props.onClose as () => void
        delete props.onClose
      }
    }
  }

  // Добавляем onClose в props, если он указан
  if (onClose) {
    props.onClose = onClose
  }

  return modalStack.open(component, props)
}

/**
 * Закрыть модальное окно по ID.
 * @description [Composable] - закрывает конкретное модальное окно в стеке по его символическому ID.
 * @return { void }
 */
export function closeModal(id: symbol): void {
  const modalStack = useModalStack()
  modalStack.close(id)
}

/**
 * Закрыть все модальные окна в стеке.
 * @description [Composable] - очищает весь стек модальных окон.
 * @return { void }
 */
export function closeAllModals(): void {
  const modalStack = useModalStack()
  modalStack.closeAll()
}

const defaultOkButton: GameModalButton = { label: 'Понятно', accent: true }

/**
 * Парсит строку эффекта и извлекает базовые значения характеристик.
 * @description [Composable] - разбирает формат «Энергия +32, Настроение +6» в Record<string, number>.
 * @return { Record<string, number> } мапа ключ→значение характеристики
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

  const pattern: RegExp = /([\wа-яё\s]+?)\s*([+-]\d+(?:\.\d+)?)/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(effectText)) !== null) {
    const [, nameRaw, valueRaw]: RegExpExecArray = match
    const name: string = (nameRaw ?? '').trim()
    const value: number = parseFloat(valueRaw ?? '0')

    const key: string = reverseMap[name] ?? name.toLowerCase()
    result[key] = value
  }

  return result
}

/**
 * Модальное окно с результатом действия или покупки (единый формат для игры).
 * @description [Composable] - показывает модалку с результатом: statBreakdown или парсинг baseEffect.
 * @return { void }
 */
export function showGameResultModal(title: string, detail: string, extra?: ShowGameResultModalExtra): void {
  const { show } = useGameModal()
  const lines: string[] = detail
    .split(/\r?\n/)
    .map((s: string) => s.trim())
    .filter(Boolean)

  if (extra?.statBreakdown && extra.statBreakdown.length > 0) {
    const actionResultLines: ActionResultStatLine[] = buildActionResultStatLines(extra.statBreakdown)
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

  const baseStatValues: Record<string, number> = extra?.baseEffect ? parseBaseStatValues(extra.baseEffect) : {}
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
