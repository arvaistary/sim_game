export interface CommandResultDto {
  success: boolean
  message: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ErrorResponse
  timestamp: number
}

export interface ErrorResponse {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type ApiErrorCode =
  | 'session_not_found'
  | 'session_expired'
  | 'validation_error'
  | 'action_not_found'
  | 'insufficient_resources'
  | 'command_id_conflict'
  | 'state_version_conflict'
  | 'persistence_unavailable'
  | 'internal_error'
  | 'network_error'

export interface ApiSuccess<T> {
  success: true
  data: T
  timestamp: number
}

export interface ApiFailure {
  success: false
  error: ErrorResponse
  timestamp: number
}
