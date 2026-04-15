/** Запись об обработанном событии в цепочке */
export interface ChainStepRecord {
  /** ID обработанного события */
  eventId: string
  /** Индекс выбранного варианта */
  choiceIndex: number
  /** Возраст персонажа при обработке */
  age: number
  /** День в игре */
  gameDay: number
}

/** Прогресс по конкретной цепочке */
export interface ChainProgress {
  /** Тег цепочки */
  chainTag: string
  /** Записи об обработанных шагах (в хронологическом порядке) */
  steps: ChainStepRecord[]
}

/** Структура компонента chain_state */
export interface ChainStateComponent {
  /** Прогресс по всем цепочкам (ключ — chainTag) */
  chains: Record<string, ChainProgress>
}
