/**
 * Offline Queue Manager (server-first migration, Stage 5.5).
 *
 * Буферизует игровые действия при offline/hybrid режиме для последующей
 * синхронизации с сервером. Persist-ится в localStorage. Потокобезопасен
 * через флаг isProcessing.
 */
import type {
  OfflineQueueStorage,
  QueuedAction,
  QueuedActionType,
  ServerSyncClient,
  SyncOutcome,
} from './offline-queue.types'
import type { ApiResponse, SyncResponse } from '@game-life/contracts'

const STORAGE_KEY: string = 'gl_offline_queue'
const MAX_QUEUE_SIZE: number = 100

/**
 * Менеджер очереди оффлайн-действий.
 *
 * @description [Application] - offline-first queue.
 */
export class OfflineQueueManager {
  private queue: QueuedAction[] = []

  private isProcessing: boolean = false

  private readonly storage: OfflineQueueStorage | null

  constructor(storage?: OfflineQueueStorage) {
    this.storage = storage ?? this.getDefaultStorage()
    this.load()
  }

  /**
   * Добавить действие в очередь.
   * @description [Application] - enqueue action.
   * @param type тип действия
   * @param payload данные действия
   * @return { QueuedAction } добавленное действие
   */
  enqueue(type: QueuedActionType, payload: Record<string, unknown>): QueuedAction {
    const action: QueuedAction = {
      id: generateId(),
      type,
      timestamp: Date.now(),
      payload,
    }

    this.queue.push(action)

    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE)
    }

    this.persist()
    return action
  }

  /**
   * Текущий размер очереди.
   * @description [Application] - queue size.
   * @return { number }
   */
  size(): number {
    return this.queue.length
  }

  /**
   * Есть ли действия в очереди.
   * @description [Application] - queue check.
   * @return { boolean }
   */
  hasPending(): boolean {
    return this.queue.length > 0
  }

  /**
   * Снимок очереди (без мутации).
   * @description [Application] - snapshot.
   * @return { QueuedAction[] }
   */
  snapshot(): QueuedAction[] {
    return [...this.queue]
  }

  /**
   * Очистить очередь.
   * @description [Application] - clear.
   * @return { void }
   */
  clear(): void {
    this.queue = []
    this.persist()
  }

  /**
   * Синхронизировать очередь с сервером.
   * @description [Application] - sync with server.
   * @param syncClient функция отправки batch на сервер
   * @return { Promise<SyncOutcome> } результат применения
   */
  async syncWithServer(syncClient: ServerSyncClient): Promise<SyncOutcome> {
    if (this.isProcessing || this.queue.length === 0) {
      return { applied: 0, failed: 0, errors: [], remaining: this.queue.length }
    }

    this.isProcessing = true
    const toSync: QueuedAction[] = [...this.queue]
    let applied: number = 0
    let failed: number = 0
    const errors: Array<{ code: string; message: string }> = []

    try {
      const response: ApiResponse<SyncResponse> = await syncClient(toSync)

      if (response.success && response.data) {
        applied = response.data.applied
        failed = response.data.failed

        if (response.data.errors) {
          errors.push(...response.data.errors)
        }
        // Успешно применено — очищаем очередь
        this.queue = []
        this.persist()
      } else {
        // Сервер вернул ошибку — оставляем очередь для retry
        failed = toSync.length
        const message: string = response.error?.message ?? 'Sync failed'
        errors.push({ code: response.error?.code ?? 'internal_error', message })
      }
    } catch (error) {
      // Сетевая ошибка — оставляем очередь для retry
      failed = toSync.length
      const message: string = error instanceof Error ? error.message : String(error)
      errors.push({ code: 'network_error', message })
    } finally {
      this.isProcessing = false
    }

    return {
      applied,
      failed,
      errors,
      remaining: this.queue.length,
    }
  }

  private persist(): void {
    if (!this.storage) return

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.queue))
    } catch {
      // localStorage может быть переполнен или недоступен — игнорируем
    }
  }

  private load(): void {
    if (!this.storage) return

    try {
      const raw: string | null = this.storage.getItem(STORAGE_KEY)

      if (!raw) return

      const parsed: unknown = JSON.parse(raw)

      if (Array.isArray(parsed)) {
        this.queue = parsed as QueuedAction[]
      }
    } catch {
      // corrupt storage — start fresh
      this.queue = []
    }
  }

  private getDefaultStorage(): OfflineQueueStorage | null {
    if (!import.meta.client) return null

    return {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: (key: string) => localStorage.removeItem(key),
    }
  }
}

function generateId(): string {
  if (import.meta.client && 'crypto' in window) {
    return crypto.randomUUID()
  }
  return `qa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
