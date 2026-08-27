/**
 * Типы для bridge между Pinia stores и GameWorld.
 * @deprecated Временные типы для миграционного периода.
 */
/**
 * Plain snapshot данных всех Pinia stores (shape как у gameStore.save()).
 * Поля optional — для устойчивости к частичным snapshots.
 */
export interface StoresSnapshot {
  player?: Record<string, unknown>
  time?: Record<string, unknown>
  stats?: Record<string, unknown>
  wallet?: Record<string, unknown>
  skills?: Record<string, unknown>
  career?: Record<string, unknown>
  education?: Record<string, unknown>
  housing?: Record<string, unknown>
  events?: Record<string, unknown>
  finance?: Record<string, unknown>
  activity?: Record<string, unknown>
  actions?: Record<string, unknown>
  tags?: Record<string, unknown>
  meta?: Record<string, unknown>
  life?: Record<string, unknown>
}

/**
 * Интерфейс для applyToStores — store-подобный объект с load().
 * Каждое поле — Pinia store или plain объект с методом load().
 */
export interface StoresLoadTarget {
  player?: { load?: (data: Record<string, unknown>) => void }
  time?: { load?: (data: Record<string, unknown>) => void }
  stats?: { load?: (data: Record<string, unknown>) => void }
  wallet?: { load?: (data: Record<string, unknown>) => void }
  skills?: { load?: (data: Record<string, unknown>) => void }
  career?: { load?: (data: Record<string, unknown>) => void }
  education?: { load?: (data: Record<string, unknown>) => void }
  housing?: { load?: (data: Record<string, unknown>) => void }
  events?: { load?: (data: Record<string, unknown>) => void }
  finance?: { load?: (data: Record<string, unknown>) => void }
  activity?: { load?: (data: Record<string, unknown>) => void }
  actions?: { load?: (data: Record<string, unknown>) => void }
  tags?: { load?: (data: Record<string, unknown>) => void }
  meta?: { load?: (data: Record<string, unknown>) => void }
  life?: { load?: (data: Record<string, unknown>) => void }
}
