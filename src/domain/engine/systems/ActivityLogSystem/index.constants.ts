/**
 * Типы записей лога активности
 */
export const LOG_ENTRY_TYPES: Record<string, string> = {
  ACTION: 'action',
  EVENT: 'event',
  STAT_CHANGE: 'stat_change',
  SKILL_CHANGE: 'skill_change',
  FINANCE: 'finance',
  CAREER: 'career',
  NAVIGATION: 'navigation',
  PREVENTED: 'prevented',
  TIME: 'time',
  EDUCATION: 'education',
}

export const MAX_ENTRIES = 200
