import type { DomainErrorCode } from './errors.types'

export class DomainError extends Error {
  public readonly code: DomainErrorCode

  public constructor(code: DomainErrorCode, message: string) {
    super(message)
    this.name = 'DomainError'
    this.code = code
  }
}
