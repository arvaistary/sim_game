export type PersistenceErrorCode = 'unavailable' | 'not_found' | 'conflict'

export interface StateVersionConflictDetails {
  sessionId: string
  expectedStateVersion: number
  actualStateVersion: number
}

export interface PersistenceErrorShape {
  code: PersistenceErrorCode
  message: string
  details?: StateVersionConflictDetails
}
