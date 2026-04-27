import { buildActionResultStatLines } from '@utils/stat-breakdown-format'
import type { ActionResultStatLine } from '@utils/stat-breakdown-format.types'
import type { StatChangeBreakdownEntry } from '@domain/balance/types'

import { useModalStack } from '../useModalStack'
import { DEFAULT_OK_BUTTON, RU_STAT_TO_KEY_MAP, STAT_VALUE_PATTERN } from './index.constants'
import type {
  GameModalOptions,
  GameModalState,
  ModalComponent,
  OpenModalOptions,
  ShowGameResultModalExtra,
} from './modal.types'

/**
 * @description [Composable] - keeps the legacy shared game modal state in sync with the host.
 * @return { ReturnType } reactive game modal state and actions
 */
export const useGameModal = () => {
  const state = useState<GameModalState>('game-modal-state', () => ({
    isOpen: false,
    title: '',
    message: '',
    lines: [],
    baseStatValues: {},
    actionResultMeta: '',
    actionResultLines: [],
    buttons: [],
  }))

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
 * @description [Composable] - opens a modal through the shared stack while preserving onClose handling.
 * @return { symbol } modal identifier in the shared stack
 */
export const openModal = (
  component: ModalComponent,
  options?: OpenModalOptions | Record<string, unknown>,
): symbol => {
  const modalStack = useModalStack()
  let props: Record<string, unknown> = {}
  let onClose: (() => void) | undefined

  if (options) {

    if ('props' in options && typeof options.props === 'object' && options.props !== null) {
      props = { ...options.props }
      onClose = typeof options.onClose === 'function' ? (options.onClose as () => void) : undefined
    } else {
      props = { ...options }

      if ('onClose' in props && typeof props.onClose === 'function') {
        onClose = props.onClose as () => void
        delete props.onClose
      }
    }
  }

  if (onClose) {
    props.onClose = onClose
  }

  return modalStack.open(component, props)
}

/**
 * @description [Composable] - closes one modal by its stack id.
 * @return { void } no return value
 */
export const closeModal = (id: symbol): void => {
  const modalStack = useModalStack()
  modalStack.close(id)
}

/**
 * @description [Composable] - closes every modal in the shared stack.
 * @return { void } no return value
 */
export const closeAllModals = (): void => {
  const modalStack = useModalStack()
  modalStack.closeAll()
}

function parseBaseStatValues(effectText: string): Record<string, number> {
  const result: Record<string, number> = {}

  if (!effectText) return result

  let match: RegExpExecArray | null = null

  while ((match = STAT_VALUE_PATTERN.exec(effectText)) !== null) {
    const nameRaw: string = match[1] ?? ''
    const valueRaw: string = match[2] ?? ''

    if (!nameRaw || !valueRaw) continue

    const name: string = nameRaw.trim()
    const value: number = Number.parseFloat(valueRaw)

    if (Number.isNaN(value)) continue

    const key: string | undefined = RU_STAT_TO_KEY_MAP[name]

    result[key ?? name.toLowerCase()] = value
  }

  return result
}

/**
 * @description [Composable] - shows the result modal for actions, purchases, or other game outcomes.
 * @return { void } no return value
 */
export const showGameResultModal = (
  title: string,
  detail: string,
  extra?: ShowGameResultModalExtra,
): void => {
  const { show } = useGameModal()
  const lines: string[] = detail
    .split(/\r?\n/)
    .map((segment) => segment.trim())
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
      buttons: [DEFAULT_OK_BUTTON],
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
    buttons: [DEFAULT_OK_BUTTON],
  })
}
