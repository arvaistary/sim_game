/**
 * TimeDiagnostics - слой наблюдаемости для системы времени
 * Отслеживает метрики производительности и поведения time-системы
 */

import { isTimeFeatureEnabled } from '@/config/feature-flags'

export interface TimeDiagnosticsMetrics {
  // Счётчики вызовов
  advanceHoursCalls: number
  advanceHoursTotalHours: number
  
  // Периодические callbacks
  weeklyCallbacksTriggered: number
  monthlyCallbacksTriggered: number
  yearlyCallbacksTriggered: number
  ageCallbacksTriggered: number
  
  // Event dedup
  eventDedupHits: number
  
  // Производительность (в миллисекундах)
  lastAdvanceHoursDuration: number
  totalAdvanceHoursDuration: number
  maxAdvanceHoursDuration: number
  
  // Статистика по скачкам времени
  largeJumpsCount: number // скачки > 168 часов
  maxJumpHours: number
  
  // Сессия
  sessionStartTime: number
  lastActionTime: number
}

export interface TimeDiagnosticsSnapshot {
  metrics: TimeDiagnosticsMetrics
  lastActionDetails: {
    hours: number
    duration: number
    timestamp: number
  } | null
}

export class TimeDiagnostics {
  private metrics: TimeDiagnosticsMetrics
  private lastActionDetails: TimeDiagnosticsSnapshot['lastActionDetails']
  private enabled: boolean

  constructor(enabled = true) {
    this.enabled = enabled
    this.metrics = this.createEmptyMetrics()
    this.lastActionDetails = null
  }

  private createEmptyMetrics(): TimeDiagnosticsMetrics {
    return {
      advanceHoursCalls: 0,
      advanceHoursTotalHours: 0,
      weeklyCallbacksTriggered: 0,
      monthlyCallbacksTriggered: 0,
      yearlyCallbacksTriggered: 0,
      ageCallbacksTriggered: 0,
      eventDedupHits: 0,
      lastAdvanceHoursDuration: 0,
      totalAdvanceHoursDuration: 0,
      maxAdvanceHoursDuration: 0,
      largeJumpsCount: 0,
      maxJumpHours: 0,
      sessionStartTime: Date.now(),
      lastActionTime: 0,
    }
  }

  /**
   * Записать начало операции advanceHours
   */
  recordAdvanceHoursStart(hours: number): number {
    if (!this.enabled) return 0
    
    this.metrics.advanceHoursCalls++
    this.metrics.advanceHoursTotalHours += hours
    this.metrics.lastActionTime = Date.now()
    
    // Отслеживаем большие скачки
    if (hours > 168) {
      this.metrics.largeJumpsCount++
      if (hours > this.metrics.maxJumpHours) {
        this.metrics.maxJumpHours = hours
      }
    }
    
    return performance.now()
  }

  /**
   * Записать завершение операции advanceHours
   */
  recordAdvanceHoursEnd(startTime: number, hours: number): void {
    if (!this.enabled) return
    
    const duration = performance.now() - startTime
    this.metrics.lastAdvanceHoursDuration = duration
    this.metrics.totalAdvanceHoursDuration += duration
    
    if (duration > this.metrics.maxAdvanceHoursDuration) {
      this.metrics.maxAdvanceHoursDuration = duration
    }
    
    this.lastActionDetails = {
      hours,
      duration,
      timestamp: Date.now(),
    }
  }

  /**
   * Записать триггер периодического callback
   */
  recordPeriodicCallback(type: 'weekly' | 'monthly' | 'yearly' | 'age', count = 1): void {
    if (!this.enabled) return
    
    switch (type) {
      case 'weekly':
        this.metrics.weeklyCallbacksTriggered += count
        break
      case 'monthly':
        this.metrics.monthlyCallbacksTriggered += count
        break
      case 'yearly':
        this.metrics.yearlyCallbacksTriggered += count
        break
      case 'age':
        this.metrics.ageCallbacksTriggered += count
        break
    }
  }

  /**
   * Записать hit event dedup
   */
  recordEventDedupHit(): void {
    if (!this.enabled) return
    this.metrics.eventDedupHits++
  }

  /**
   * Получить текущие метрики
   */
  getMetrics(): TimeDiagnosticsMetrics {
    return { ...this.metrics }
  }

  /**
   * Получить полный снимок состояния
   */
  getSnapshot(): TimeDiagnosticsSnapshot {
    return {
      metrics: this.getMetrics(),
      lastActionDetails: this.lastActionDetails 
        ? { ...this.lastActionDetails } 
        : null,
    }
  }

  /**
   * Получить отчёт по последнему действию
   */
  getLastActionReport(): string {
    if (!this.lastActionDetails) {
      return 'Нет записанных действий'
    }
    
    const { hours, duration, timestamp } = this.lastActionDetails
    const timeAgo = Date.now() - timestamp
    
    return [
      `Последнее действие:`,
      `  Часы: ${hours}`,
      `  Длительность: ${duration.toFixed(2)}ms`,
      `  Время: ${new Date(timestamp).toISOString()}`,
      `  Прошло: ${(timeAgo / 1000).toFixed(1)}s назад`,
    ].join('\n')
  }

  /**
   * Получить сводный отчёт по сессии
   */
  getSessionReport(): string {
    const sessionDuration = Date.now() - this.metrics.sessionStartTime
    const avgAdvanceDuration = this.metrics.advanceHoursCalls > 0
      ? this.metrics.totalAdvanceHoursDuration / this.metrics.advanceHoursCalls
      : 0
    
    return [
      '=== Time Diagnostics Report ===',
      '',
      'Сессия:',
      `  Длительность: ${(sessionDuration / 1000).toFixed(1)}s`,
      `  Начало: ${new Date(this.metrics.sessionStartTime).toISOString()}`,
      '',
      'Операции advanceHours:',
      `  Вызовы: ${this.metrics.advanceHoursCalls}`,
      `  Всего часов: ${this.metrics.advanceHoursTotalHours}`,
      `  Средняя длительность: ${avgAdvanceDuration.toFixed(2)}ms`,
      `  Макс. длительность: ${this.metrics.maxAdvanceHoursDuration.toFixed(2)}ms`,
      '',
      'Периодические callbacks:',
      `  Weekly: ${this.metrics.weeklyCallbacksTriggered}`,
      `  Monthly: ${this.metrics.monthlyCallbacksTriggered}`,
      `  Yearly: ${this.metrics.yearlyCallbacksTriggered}`,
      `  Age: ${this.metrics.ageCallbacksTriggered}`,
      '',
      'Event dedup:',
      `  Hits: ${this.metrics.eventDedupHits}`,
      '',
      'Большие скачки (>168h):',
      `  Количество: ${this.metrics.largeJumpsCount}`,
      `  Макс. скачок: ${this.metrics.maxJumpHours}h`,
      '',
      this.getLastActionReport(),
    ].join('\n')
  }

  /**
   * Сбросить метрики
   */
  reset(): void {
    this.metrics = this.createEmptyMetrics()
    this.lastActionDetails = null
  }

  /**
   * Включить/выключить диагностику
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Проверить, включена ли диагностика
   */
  isEnabled(): boolean {
    return this.enabled
  }
}

// Глобальный экземпляр для использования в dev-режиме
let globalDiagnostics: TimeDiagnostics | null = null

export function getGlobalTimeDiagnostics(): TimeDiagnostics {
  if (!globalDiagnostics) {
    // Включаем если dev-режим ИЛИ включён feature flag
    const isDev = import.meta.env?.DEV ?? false
    const featureFlagEnabled = isTimeFeatureEnabled('timeDiagnostics')
    globalDiagnostics = new TimeDiagnostics(isDev || featureFlagEnabled)
  }
  return globalDiagnostics
}

export function resetGlobalTimeDiagnostics(): void {
  globalDiagnostics = null
}
