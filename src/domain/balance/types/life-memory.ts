/** Запись в памяти персонажа */
export interface LifeMemoryEntry {
  /** Уникальный ID */
  id: string
  /** Возраст когда произошло */
  age: number
  /** Краткое описание (для UI) */
  summary: string
  /** Эмоциональная окраска (-100 до +100) */
  emotionalWeight: number
  /** Теги для поиска и фильтрации */
  tags: string[]
  /** Связанное событие */
  sourceEventId?: string
  /** Связанный выбор */
  sourceChoiceLabel?: string
  /** День в игре */
  gameDay: number
  /** Влияет ли на текущие выборы */
  active: boolean
}

/** Структура компонента life_memory */
export interface LifeMemoryComponent {
  memories: LifeMemoryEntry[]
  /** Общий эмоциональный фон детства (-100 до +100) */
  childhoodScore: number
}
