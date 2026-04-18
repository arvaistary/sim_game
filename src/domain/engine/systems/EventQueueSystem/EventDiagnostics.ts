/**
 * Диагностика и метрики для event pipeline
 */

export interface EventDiagnosticsMetrics {
  // Счётчики
  enqueueCount: number
  dedupHits: number
  rejectedInvalid: number
  rejectedDuplicate: number
  acceptedCount: number
  
  // Время выполнения (мс)
  enqueueLatencyP50: number
  enqueueLatencyP95: number
  enqueueLatencyP99: number
  resolveLatencyP50: number
  resolveLatencyP95: number
  resolveLatencyP99: number
  
  // Состояние очереди
  queueSize: number
  queueSizeMax: number
  queueSizeAvg: number
  
  // Ошибки
  resolveFailures: number
  resolveFailureReasons: Record<string, number>
  
  // Period dedup
  periodDedupHits: number
  periodDedupWeekly: number
  periodDedupMonthly: number
  periodDedupYearly: number
}

export interface EventDiagnosticsSnapshot {
  timestamp: number
  metrics: EventDiagnosticsMetrics
}

/**
 * Система диагностики event pipeline
 */
export class EventDiagnostics {
  private metrics: EventDiagnosticsMetrics = {
    enqueueCount: 0,
    dedupHits: 0,
    rejectedInvalid: 0,
    rejectedDuplicate: 0,
    acceptedCount: 0,
    enqueueLatencyP50: 0,
    enqueueLatencyP95: 0,
    enqueueLatencyP99: 0,
    resolveLatencyP50: 0,
    resolveLatencyP95: 0,
    resolveLatencyP99: 0,
    queueSize: 0,
    queueSizeMax: 0,
    queueSizeAvg: 0,
    resolveFailures: 0,
    resolveFailureReasons: {},
    periodDedupHits: 0,
    periodDedupWeekly: 0,
    periodDedupMonthly: 0,
    periodDedupYearly: 0,
  }

  private enqueueLatencies: number[] = []
  private resolveLatencies: number[] = []
  private queueSizes: number[] = []
  private maxLatencySamples = 1000
  private maxQueueSizeSamples = 1000

  /**
   * Записывает метрику enqueue
   * @param latency - Время выполнения в мс
   * @param result - Результат операции
   */
  recordEnqueue(latency: number, result: 'accepted' | 'rejected_duplicate' | 'rejected_invalid'): void {
    this.metrics.enqueueCount++
    
    if (result === 'accepted') {
      this.metrics.acceptedCount++
    } else if (result === 'rejected_duplicate') {
      this.metrics.rejectedDuplicate++
      this.metrics.dedupHits++
    } else {
      this.metrics.rejectedInvalid++
    }

    // Записываем latency
    this.enqueueLatencies.push(latency)
    if (this.enqueueLatencies.length > this.maxLatencySamples) {
      this.enqueueLatencies.shift()
    }

    this._updateLatencyMetrics('enqueue')
  }

  /**
   * Записывает метрику resolve
   * @param latency - Время выполнения в мс
   * @param success - Успешность операции
   * @param failureReason - Причина отказа (если неуспешно)
   */
  recordResolve(latency: number, success: boolean, failureReason?: string): void {
    if (!success) {
      this.metrics.resolveFailures++
      if (failureReason) {
        this.metrics.resolveFailureReasons[failureReason] = 
          (this.metrics.resolveFailureReasons[failureReason] || 0) + 1
      }
    }

    // Записываем latency
    this.resolveLatencies.push(latency)
    if (this.resolveLatencies.length > this.maxLatencySamples) {
      this.resolveLatencies.shift()
    }

    this._updateLatencyMetrics('resolve')
  }

  /**
   * Записывает размер очереди
   * @param size - Текущий размер очереди
   */
  recordQueueSize(size: number): void {
    this.metrics.queueSize = size
    this.metrics.queueSizeMax = Math.max(this.metrics.queueSizeMax, size)
    
    this.queueSizes.push(size)
    if (this.queueSizes.length > this.maxQueueSizeSamples) {
      this.queueSizes.shift()
    }

    // Вычисляем среднее
    const sum = this.queueSizes.reduce((a, b) => a + b, 0)
    this.metrics.queueSizeAvg = sum / this.queueSizes.length
  }

  /**
   * Записывает period dedup hit
   * @param period - Тип периода
   */
  recordPeriodDedupHit(period: 'weekly' | 'monthly' | 'yearly'): void {
    this.metrics.periodDedupHits++
    
    if (period === 'weekly') {
      this.metrics.periodDedupWeekly++
    } else if (period === 'monthly') {
      this.metrics.periodDedupMonthly++
    } else {
      this.metrics.periodDedupYearly++
    }
  }

  /**
   * Обновляет метрики latency (P50, P95, P99)
   * @param type - Тип операции ('enqueue' или 'resolve')
   */
  private _updateLatencyMetrics(type: 'enqueue' | 'resolve'): void {
    const latencies = type === 'enqueue' ? this.enqueueLatencies : this.resolveLatencies
    
    if (latencies.length === 0) return

    const sorted = [...latencies].sort((a, b) => a - b)
    const p50Index = Math.floor(sorted.length * 0.5)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p99Index = Math.floor(sorted.length * 0.99)

    if (type === 'enqueue') {
      this.metrics.enqueueLatencyP50 = sorted[p50Index] || 0
      this.metrics.enqueueLatencyP95 = sorted[p95Index] || 0
      this.metrics.enqueueLatencyP99 = sorted[p99Index] || 0
    } else {
      this.metrics.resolveLatencyP50 = sorted[p50Index] || 0
      this.metrics.resolveLatencyP95 = sorted[p95Index] || 0
      this.metrics.resolveLatencyP99 = sorted[p99Index] || 0
    }
  }

  /**
   * Получает текущие метрики
   * @returns Метрики
   */
  getMetrics(): EventDiagnosticsMetrics {
    return { ...this.metrics }
  }

  /**
   * Создаёт снимок метрик
   * @returns Снимок
   */
  createSnapshot(): EventDiagnosticsSnapshot {
    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
    }
  }

  /**
   * Сбрасывает метрики
   */
  reset(): void {
    this.metrics = {
      enqueueCount: 0,
      dedupHits: 0,
      rejectedInvalid: 0,
      rejectedDuplicate: 0,
      acceptedCount: 0,
      enqueueLatencyP50: 0,
      enqueueLatencyP95: 0,
      enqueueLatencyP99: 0,
      resolveLatencyP50: 0,
      resolveLatencyP95: 0,
      resolveLatencyP99: 0,
      queueSize: 0,
      queueSizeMax: 0,
      queueSizeAvg: 0,
      resolveFailures: 0,
      resolveFailureReasons: {},
      periodDedupHits: 0,
      periodDedupWeekly: 0,
      periodDedupMonthly: 0,
      periodDedupYearly: 0,
    }
    this.enqueueLatencies = []
    this.resolveLatencies = []
    this.queueSizes = []
  }

  /**
   * Проверяет соответствие бюджетам производительности
   * @returns Результат проверки
   */
  checkPerformanceBudgets(): {
    enqueueP95Ok: boolean
    resolveP95Ok: boolean
    queueSizeOk: boolean
    errorRateOk: boolean
  } {
    const enqueueP95Ok = this.metrics.enqueueLatencyP95 <= 2 // 2ms budget
    const resolveP95Ok = this.metrics.resolveLatencyP95 <= 8 // 8ms budget
    const queueSizeOk = this.metrics.queueSize <= 250 // 250 max queue size
    const totalOperations = this.metrics.enqueueCount
    const errorRate = totalOperations > 0 
      ? this.metrics.resolveFailures / totalOperations 
      : 0
    const errorRateOk = errorRate <= 0.001 // 0.1% error budget

    return {
      enqueueP95Ok,
      resolveP95Ok,
      queueSizeOk,
      errorRateOk,
    }
  }
}
