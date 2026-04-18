/**
 * Performance Budget и Safeguards
 * Отслеживает производительность критических операций и предотвращает деградацию
 */

export interface PerformanceBudget {
  operation: string
  maxDuration: number // в миллисекундах
  warnThreshold: number // в миллисекундах
}

export interface PerformanceMeasurement {
  operation: string
  duration: number
  timestamp: number
  exceededBudget: boolean
  exceededWarnThreshold: boolean
}

export interface PerformanceStats {
  operation: string
  count: number
  totalDuration: number
  avgDuration: number
  maxDuration: number
  minDuration: number
  budgetExceededCount: number
  warnThresholdExceededCount: number
}

export class PerformanceBudgetManager {
  private budgets: Map<string, PerformanceBudget>
  private measurements: PerformanceMeasurement[]
  private enabled: boolean
  private maxMeasurements: number

  constructor(maxMeasurements = 1000) {
    this.budgets = new Map()
    this.measurements = []
    this.enabled = true
    this.maxMeasurements = maxMeasurements
    
    this._setDefaultBudgets()
  }

  /**
   * Установить бюджет по умолчанию для критических операций
   */
  private _setDefaultBudgets(): void {
    // canExecute batch - проверка доступности действий
    this.budgets.set('canExecute:batch', {
      operation: 'canExecute:batch',
      maxDuration: 50, // 50ms для проверки 100+ действий
      warnThreshold: 30,
    })

    // advanceHours - продвижение времени
    this.budgets.set('advanceHours', {
      operation: 'advanceHours',
      maxDuration: 100, // 100ms для обычного действия
      warnThreshold: 50,
    })

    // advanceHours:large - большие скачки времени
    this.budgets.set('advanceHours:large', {
      operation: 'advanceHours:large',
      maxDuration: 500, // 500ms для скачков > 168h
      warnThreshold: 300,
    })

    // save - сохранение игры
    this.budgets.set('save', {
      operation: 'save',
      maxDuration: 200, // 200ms для сохранения
      warnThreshold: 100,
    })

    // load - загрузка игры
    this.budgets.set('load', {
      operation: 'load',
      maxDuration: 500, // 500ms для загрузки
      warnThreshold: 300,
    })

    // period hooks - выполнение периодических callbacks
    this.budgets.set('periodHooks:weekly', {
      operation: 'periodHooks:weekly',
      maxDuration: 50,
      warnThreshold: 30,
    })

    this.budgets.set('periodHooks:monthly', {
      operation: 'periodHooks:monthly',
      maxDuration: 100,
      warnThreshold: 50,
    })

    this.budgets.set('periodHooks:yearly', {
      operation: 'periodHooks:yearly',
      maxDuration: 200,
      warnThreshold: 100,
    })
  }

  /**
   * Установить бюджет для операции
   */
  setBudget(operation: string, budget: Omit<PerformanceBudget, 'operation'>): void {
    this.budgets.set(operation, { ...budget, operation })
  }

  /**
   * Получить бюджет для операции
   */
  getBudget(operation: string): PerformanceBudget | undefined {
    return this.budgets.get(operation)
  }

  /**
   * Измерить выполнение операции
   */
  measure<T>(operation: string, fn: () => T): T {
    if (!this.enabled) {
      return fn()
    }

    const startTime = performance.now()
    let result: T
    let error: Error | null = null

    try {
      result = fn()
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e))
      throw error
    } finally {
      const duration = performance.now() - startTime
      this._recordMeasurement(operation, duration)
    }

    return result
  }

  /**
   * Асинхронно измерить выполнение операции
   */
  async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return fn()
    }

    const startTime = performance.now()
    let result: T
    let error: Error | null = null

    try {
      result = await fn()
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e))
      throw error
    } finally {
      const duration = performance.now() - startTime
      this._recordMeasurement(operation, duration)
    }

    return result
  }

  /**
   * Записать измерение
   */
  private _recordMeasurement(operation: string, duration: number): void {
    const budget = this.budgets.get(operation)
    const measurement: PerformanceMeasurement = {
      operation,
      duration,
      timestamp: Date.now(),
      exceededBudget: budget ? duration > budget.maxDuration : false,
      exceededWarnThreshold: budget ? duration > budget.warnThreshold : false,
    }

    this.measurements.push(measurement)

    // Ограничиваем количество измерений
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift()
    }

    // Логируем превышение бюджета
    if (measurement.exceededBudget) {
      console.warn(
        `[PerformanceBudget] Operation "${operation}" exceeded budget:`,
        `${duration.toFixed(2)}ms > ${budget!.maxDuration}ms`
      )
    }

    // Логируем превышение warn threshold
    if (measurement.exceededWarnThreshold && !measurement.exceededBudget) {
      console.warn(
        `[PerformanceBudget] Operation "${operation}" exceeded warn threshold:`,
        `${duration.toFixed(2)}ms > ${budget!.warnThreshold}ms`
      )
    }
  }

  /**
   * Получить статистику по операции
   */
  getStats(operation: string): PerformanceStats | null {
    const operationMeasurements = this.measurements.filter(m => m.operation === operation)
    
    if (operationMeasurements.length === 0) {
      return null
    }

    const durations = operationMeasurements.map(m => m.duration)
    const totalDuration = durations.reduce((sum, d) => sum + d, 0)
    const budgetExceededCount = operationMeasurements.filter(m => m.exceededBudget).length
    const warnThresholdExceededCount = operationMeasurements.filter(m => m.exceededWarnThreshold).length

    return {
      operation,
      count: operationMeasurements.length,
      totalDuration,
      avgDuration: totalDuration / operationMeasurements.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      budgetExceededCount,
      warnThresholdExceededCount,
    }
  }

  /**
   * Получить статистику по всем операциям
   */
  getAllStats(): PerformanceStats[] {
    const operations = Array.from(new Set(this.measurements.map(m => m.operation)))
    return operations
      .map(op => this.getStats(op))
      .filter((s): s is PerformanceStats => s !== null)
  }

  /**
   * Получить отчёт по производительности
   */
  getReport(): string {
    const stats = this.getAllStats()
    
    if (stats.length === 0) {
      return 'Нет данных о производительности'
    }

    const lines = [
      '=== Performance Budget Report ===',
      '',
      `Статус: ${this.enabled ? 'Включён' : 'Выключен'}`,
      `Всего измерений: ${this.measurements.length}`,
      '',
      'Статистика по операциям:',
    ]

    for (const stat of stats) {
      const budget = this.budgets.get(stat.operation)
      lines.push('')
      lines.push(`${stat.operation}:`)
      lines.push(`  Вызовы: ${stat.count}`)
      lines.push(`  Средняя длительность: ${stat.avgDuration.toFixed(2)}ms`)
      lines.push(`  Мин/Макс: ${stat.minDuration.toFixed(2)}ms / ${stat.maxDuration.toFixed(2)}ms`)
      lines.push(`  Превышение бюджета: ${stat.budgetExceededCount} (${((stat.budgetExceededCount / stat.count) * 100).toFixed(1)}%)`)
      lines.push(`  Превышение warn threshold: ${stat.warnThresholdExceededCount} (${((stat.warnThresholdExceededCount / stat.count) * 100).toFixed(1)}%)`)
      
      if (budget) {
        lines.push(`  Бюджет: ${budget.warnThreshold}ms (warn) / ${budget.maxDuration}ms (max)`)
      }
    }

    return lines.join('\n')
  }

  /**
   * Проверить, превышен ли бюджет для операции
   */
  isBudgetExceeded(operation: string): boolean {
    const stats = this.getStats(operation)
    if (!stats) {
      return false
    }
    return stats.budgetExceededCount > 0
  }

  /**
   * Получить процент превышения бюджета
   */
  getBudgetExceedRate(operation: string): number {
    const stats = this.getStats(operation)
    if (!stats || stats.count === 0) {
      return 0
    }
    return (stats.budgetExceededCount / stats.count) * 100
  }

  /**
   * Очистить измерения
   */
  clearMeasurements(): void {
    this.measurements = []
  }

  /**
   * Очистить измерения для конкретной операции
   */
  clearOperationMeasurements(operation: string): void {
    this.measurements = this.measurements.filter(m => m.operation !== operation)
  }

  /**
   * Включить/выключить мониторинг производительности
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Проверить, включён ли мониторинг
   */
  isEnabled(): boolean {
    return this.enabled
  }
}

// Глобальный экземпляр
let globalPerformanceBudget: PerformanceBudgetManager | null = null

export function getGlobalPerformanceBudget(): PerformanceBudgetManager {
  if (!globalPerformanceBudget) {
    globalPerformanceBudget = new PerformanceBudgetManager()
  }
  return globalPerformanceBudget
}

export function resetGlobalPerformanceBudget(): void {
  globalPerformanceBudget = null
}
