/**
 * Типы для OfflineQueueManager (server-first migration, Stage 5.5).
 */
import type { ApiResponse, SyncResponse } from '@game-life/contracts'

export type QueuedActionType =
  | 'action'
  | 'work'
  | 'event'
  | 'career'
  | 'finance'
  | 'education'
  | 'time'

export interface QueuedAction {
  id: string
  type: QueuedActionType
  timestamp: number
  payload: Record<string, unknown>
  expectedStateVersion?: number
}

export interface SyncOutcome {
  applied: number
  failed: number
  errors: Array<{ code: string; message: string }>
  remaining: number
}

export type OfflineQueueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type ServerSyncClient = (actions: QueuedAction[]) => Promise<ApiResponse<SyncResponse>>
