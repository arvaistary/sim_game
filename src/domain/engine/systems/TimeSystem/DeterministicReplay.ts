/**
 * Deterministic Replay - детерминированный replay для отладки багов времени
 * Логирует time-команды и позволяет воспроизводить их для воспроизведения багов
 */

import { isTimeFeatureEnabled } from '@/config/feature-flags'

export interface TimeCommand {
  id: string
  actionId?: string
  hourCost: number
  totalHoursBefore: number
  totalHoursAfter: number
  timestamp: number
  seed?: number
  metadata?: Record<string, unknown>
}

export interface ReplaySession {
  id: string
  startTime: number
  endTime?: number
  commands: TimeCommand[]
  initialWorldState?: Record<string, unknown>
}

export class DeterministicReplay {
  private enabled: boolean
  private currentSession: ReplaySession | null
  private sessions: ReplaySession[]
  private maxSessionSize: number

  constructor(maxSessionSize = 1000) {
    this.enabled = isTimeFeatureEnabled('deterministicReplay')
    this.currentSession = null
    this.sessions = []
    this.maxSessionSize = maxSessionSize
  }

  /**
   * Начать новую сессию записи
   */
  startSession(initialWorldState?: Record<string, unknown>): string {
    if (!this.enabled) {
      return ''
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      commands: [],
      initialWorldState,
    }

    return sessionId
  }

  /**
   * Записать time-команду
   */
  recordCommand(command: Omit<TimeCommand, 'id' | 'timestamp'>): void {
    if (!this.enabled || !this.currentSession) {
      return
    }

    const timeCommand: TimeCommand = {
      ...command,
      id: `cmd_${this.currentSession.commands.length}_${Date.now()}`,
      timestamp: Date.now(),
    }

    this.currentSession.commands.push(timeCommand)

    // Ограничиваем размер сессии
    if (this.currentSession.commands.length > this.maxSessionSize) {
      this.currentSession.commands.shift()
    }
  }

  /**
   * Завершить текущую сессию
   */
  endSession(): ReplaySession | null {
    if (!this.enabled || !this.currentSession) {
      return null
    }

    this.currentSession.endTime = Date.now()
    const session = { ...this.currentSession }
    this.sessions.push(session)
    this.currentSession = null

    // Ограничиваем количество сохранённых сессий
    if (this.sessions.length > 10) {
      this.sessions.shift()
    }

    return session
  }

  /**
   * Получить текущую сессию
   */
  getCurrentSession(): ReplaySession | null {
    return this.currentSession ? { ...this.currentSession } : null
  }

  /**
   * Получить сессию по ID
   */
  getSession(sessionId: string): ReplaySession | null {
    const session = this.sessions.find(s => s.id === sessionId)
    return session ? { ...session } : null
  }

  /**
   * Получить все сессии
   */
  getAllSessions(): ReplaySession[] {
    return this.sessions.map(s => ({ ...s }))
  }

  /**
   * Удалить сессию
   */
  deleteSession(sessionId: string): boolean {
    const index = this.sessions.findIndex(s => s.id === sessionId)
    if (index !== -1) {
      this.sessions.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Очистить все сессии
   */
  clearAllSessions(): void {
    this.sessions = []
    this.currentSession = null
  }

  /**
   * Экспортировать сессию в JSON
   */
  exportSession(sessionId: string): string | null {
    const session = this.getSession(sessionId)
    if (!session) {
      return null
    }
    return JSON.stringify(session, null, 2)
  }

  /**
   * Импортировать сессию из JSON
   */
  importSession(json: string): ReplaySession | null {
    try {
      const session = JSON.parse(json) as ReplaySession
      this.sessions.push(session)
      return session
    } catch (error) {
      console.error('[DeterministicReplay] Failed to import session:', error)
      return null
    }
  }

  /**
   * Сгенерировать replay-сценарий для воспроизведения
   */
  generateReplayScenario(sessionId: string): string | null {
    const session = this.getSession(sessionId)
    if (!session) {
      return null
    }

    const lines = [
      '// Replay Scenario for Time System',
      `// Session: ${session.id}`,
      `// Duration: ${session.endTime ? session.endTime - session.startTime : 0}ms`,
      `// Commands: ${session.commands.length}`,
      '',
      'import { createWorldFromSave } from "@/domain/game-facade"',
      '',
      'async function replayScenario() {',
      '  // Create world from initial state',
      `  const world = createWorldFromSave(${JSON.stringify(session.initialWorldState || {}, null, 2)})`,
      '  const timeSystem = world.getSystem(TimeSystem)',
      '',
      '  // Execute commands',
    ]

    for (const cmd of session.commands) {
      lines.push('')
      lines.push(`  // Command: ${cmd.id}`)
      lines.push(`  // Action: ${cmd.actionId || 'N/A'}`)
      lines.push(`  // Hours: ${cmd.hourCost}`)
      lines.push(`  // Before: ${cmd.totalHoursBefore}h, After: ${cmd.totalHoursAfter}h`)
      lines.push(`  timeSystem.advanceHours(${cmd.hourCost}, {`)
      if (cmd.actionId) {
        lines.push(`    actionType: '${cmd.actionId}',`)
      }
      if (cmd.seed !== undefined) {
        lines.push(`    seed: ${cmd.seed},`)
      }
      lines.push('  })')
    }

    lines.push('')
    lines.push('  return world')
    lines.push('}')
    lines.push('')
    lines.push('replayScenario().catch(console.error)')

    return lines.join('\n')
  }

  /**
   * Получить отчёт по сессии
   */
  getSessionReport(sessionId: string): string | null {
    const session = this.getSession(sessionId)
    if (!session) {
      return null
    }

    const totalHours = session.commands.reduce((sum, cmd) => sum + cmd.hourCost, 0)
    const duration = session.endTime ? session.endTime - session.startTime : 0

    const lines = [
      '=== Replay Session Report ===',
      '',
      `Session ID: ${session.id}`,
      `Start: ${new Date(session.startTime).toISOString()}`,
      `End: ${session.endTime ? new Date(session.endTime).toISOString() : 'In progress'}`,
      `Duration: ${duration}ms`,
      '',
      'Commands:',
      `  Total: ${session.commands.length}`,
      `  Total hours: ${totalHours}`,
      `  Avg hours per command: ${session.commands.length > 0 ? (totalHours / session.commands.length).toFixed(2) : 0}`,
      '',
      'Command breakdown:',
    ]

    // Группировка команд по actionId
    const byAction = session.commands.reduce((acc, cmd) => {
      const key = cmd.actionId || 'unknown'
      if (!acc[key]) {
        acc[key] = { count: 0, hours: 0 }
      }
      acc[key].count++
      acc[key].hours += cmd.hourCost
      return acc
    }, {} as Record<string, { count: number; hours: number }>)

    for (const [actionId, data] of Object.entries(byAction)) {
      lines.push(`  ${actionId}:`)
      lines.push(`    Count: ${data.count}`)
      lines.push(`    Hours: ${data.hours}`)
    }

    return lines.join('\n')
  }

  /**
   * Включить/выключить replay
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.currentSession = null
    }
  }

  /**
   * Проверить, включён ли replay
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Получить статистику
   */
  getStats() {
    return {
      enabled: this.enabled,
      totalSessions: this.sessions.length,
      currentSessionActive: this.currentSession !== null,
      totalCommands: this.sessions.reduce((sum, s) => sum + s.commands.length, 0),
      currentSessionCommands: this.currentSession?.commands.length || 0,
    }
  }
}

// Глобальный экземпляр
let globalReplay: DeterministicReplay | null = null

export function getGlobalDeterministicReplay(): DeterministicReplay {
  if (!globalReplay) {
    globalReplay = new DeterministicReplay()
  }
  return globalReplay
}

export function resetGlobalDeterministicReplay(): void {
  globalReplay = null
}
