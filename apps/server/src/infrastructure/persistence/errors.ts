export class PersistenceError extends Error {
  public readonly code: 'unavailable' | 'not_found' | 'conflict'
  public readonly details?: {
    sessionId?: string
    expectedStateVersion?: number
    actualStateVersion?: number
  }

  public constructor(
    code: 'unavailable' | 'not_found' | 'conflict',
    message: string,
    options?: ErrorOptions,
    details?: PersistenceError['details'],
  ) {
    super(message, options)
    this.name = 'PersistenceError'
    this.code = code
    this.details = details
  }
}
