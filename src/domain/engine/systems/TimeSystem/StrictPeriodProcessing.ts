/**
 * Strict Period Processing - строгий режим обработки периодических callbacks
 * Обеспечивает надёжность выполнения периодических операций с обработкой ошибок
 */

import { isTimeFeatureEnabled } from '@/config/feature-flags'

export interface PeriodCallbackError {
  callbackName: string
  periodType: 'weekly' | 'monthly' | 'yearly' | 'age'
  periodValue: number
  error: Error
  timestamp: number
}

export interface PeriodProcessingResult {
  success: boolean
  executedCallbacks: number
  failedCallbacks: number
  errors: PeriodCallbackError[]
  rollbackPerformed: boolean
}

export type PeriodCallbackWithMetadata = {
  callback: (...args: number[]) => void
  name: string
}

export class StrictPeriodProcessing {
  private enabled: boolean
  private errors: PeriodCallbackError[]
  private stats: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    rollbacksPerformed: number
  }

  constructor() {
    this.enabled = isTimeFeatureEnabled('strictPeriodProcessing')
    this.errors = []
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      rollbacksPerformed: 0,
    }
  }

  /**
   * Выполнить периодические callbacks в строгом режиме
   */
  executeCallbacks(
    callbacks: PeriodCallbackWithMetadata[],
    periodType: 'weekly' | 'monthly' | 'yearly' | 'age',
    periodValue: number,
    rollbackFn?: () => void
  ): PeriodProcessingResult {
    if (!this.enabled) {
      // В обычном режиме выполняем без обработки ошибок
      callbacks.forEach(cb => cb.callback(periodValue))
      return {
        success: true,
        executedCallbacks: callbacks.length,
        failedCallbacks: 0,
        errors: [],
        rollbackPerformed: false,
      }
    }

    this.stats.totalExecutions++
    const result: PeriodProcessingResult = {
      success: true,
      executedCallbacks: 0,
      failedCallbacks: 0,
      errors: [],
      rollbackPerformed: false,
    }

    const errorsDuringExecution: PeriodCallbackError[] = []

    // Выполняем все callbacks, собирая ошибки
    for (const { callback, name } of callbacks) {
      try {
        callback(periodValue)
        result.executedCallbacks++
        this.stats.successfulExecutions++
      } catch (error) {
        const callbackError: PeriodCallbackError = {
          callbackName: name,
          periodType,
          periodValue,
          error: error instanceof Error ? error : new Error(String(error)),
          timestamp: Date.now(),
        }
        errorsDuringExecution.push(callbackError)
        result.failedCallbacks++
        this.stats.failedExecutions++
        this.errors.push(callbackError)
      }
    }

    // Если были ошибки, выполняем rollback
    if (errorsDuringExecution.length > 0) {
      result.success = false
      result.errors = errorsDuringExecution

      if (rollbackFn) {
        try {
          rollbackFn()
          result.rollbackPerformed = true
          this.stats.rollbacksPerformed++
        } catch (rollbackError) {
          // Ошибка rollback - критическая ситуация
          console.error('[StrictPeriodProcessing] Rollback failed:', rollbackError)
        }
      }
    }

    return result
  }

  /**
   * Получить накопленные ошибки
   */
  getErrors(): PeriodCallbackError[] {
    return [...this.errors]
  }

  /**
   * Очистить накопленные ошибки
   */
  clearErrors(): void {
    this.errors = []
  }

  /**
   * Получить статистику выполнения
   */
  getStats() {
    return {
      ...this.stats,
      errorRate: this.stats.totalExecutions > 0
        ? this.stats.failedExecutions / this.stats.totalExecutions
        : 0,
      successRate: this.stats.totalExecutions > 0
        ? this.stats.successfulExecutions / this.stats.totalExecutions
        : 0,
    }
  }

  /**
   * Сбросить статистику
   */
  resetStats(): void {
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      rollbacksPerformed: 0,
    }
  }

  /**
   * Включить/выключить строгий режим
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Проверить, включён ли строгий режим
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Получить отчёт по ошибкам
   */
  getErrorReport(): string {
    if (this.errors.length === 0) {
      return 'Нет накопленных ошибок'
    }

    const errorsByType = this.errors.reduce((acc, err) => {
      const key = `${err.periodType}_${err.periodValue}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(err)
      return acc
    }, {} as Record<string, PeriodCallbackError[]>)

    const lines = [
      '=== Strict Period Processing - Error Report ===',
      '',
      `Всего ошибок: ${this.errors.length}`,
      '',
    ]

    for (const [key, errors] of Object.entries(errorsByType)) {
      lines.push(`Период: ${key}`)
      lines.push(`  Количество ошибок: ${errors.length}`)
      for (const err of errors) {
        lines.push(`  - ${err.callbackName}: ${err.error.message}`)
      }
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Получить отчёт по статистике
   */
  getStatsReport(): string {
    const stats = this.getStats()
    return [
      '=== Strict Period Processing - Stats Report ===',
      '',
      `Статус: ${this.enabled ? 'Включён' : 'Выключен'}`,
      '',
      'Выполнения:',
      `  Всего: ${stats.totalExecutions}`,
      `  Успешных: ${stats.successfulExecutions}`,
      `  Неудачных: ${stats.failedExecutions}`,
      `  Rollback: ${stats.rollbacksPerformed}`,
      '',
      'Показатели:',
      `  Success rate: ${(stats.successRate * 100).toFixed(2)}%`,
      `  Error rate: ${(stats.errorRate * 100).toFixed(2)}%`,
    ].join('\n')
  }
}

// Глобальный экземпляр
let globalStrictProcessing: StrictPeriodProcessing | null = null

export function getGlobalStrictPeriodProcessing(): StrictPeriodProcessing {
  if (!globalStrictProcessing) {
    globalStrictProcessing = new StrictPeriodProcessing()
  }
  return globalStrictProcessing
}

export function resetGlobalStrictPeriodProcessing(): void {
  globalStrictProcessing = null
}
