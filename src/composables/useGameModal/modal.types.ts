/**
 * Унифицированный интерфейс для модальных окон
 */

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
  props?: Record<string, any>
  /** Callback, который будет вызван при закрытии */
  onClose?: () => void
}

/**
 * Тип для компонента модального окна
 */
export type ModalComponent = import('vue').Component

/**
 * Объединяет базовые пропсы с пользовательскими
 */
export type ModalProps<T extends BaseModalProps = BaseModalProps> = T
