import { INFANT_EVENTS } from './infant-events'
import { PRESCHOOL_EVENTS } from './preschool-events'
import { SCHOOL_EVENTS } from './school-events'
import { TEEN_EVENTS } from './teen-events'
import { YOUNG_EVENTS } from './young-events'
import type { ChildhoodEventDef } from '@/domain/balance/types/childhood-event'
import { AgeGroup } from '@/domain/balance/actions/types'

/**
 * Все детские события (0-18 лет).
 * Сгруппированы по возрастным группам.
 */
export const ALL_CHILDHOOD_EVENTS: ChildhoodEventDef[] = [
  ...INFANT_EVENTS,
  ...PRESCHOOL_EVENTS,
  ...SCHOOL_EVENTS,
  ...TEEN_EVENTS,
  ...YOUNG_EVENTS,
]

/**
 * События по возрастным группам
 */
export const CHILDHOOD_EVENTS_BY_AGE_GROUP: Partial<Record<AgeGroup, ChildhoodEventDef[]>> = {
  [AgeGroup.INFANT]: INFANT_EVENTS,
  [AgeGroup.CHILD]: PRESCHOOL_EVENTS,
  [AgeGroup.KID]: SCHOOL_EVENTS,
  [AgeGroup.TEEN]: TEEN_EVENTS,
  [AgeGroup.YOUNG]: YOUNG_EVENTS,
}

/**
 * Получить события для текущей возрастной группы
 */
export function getChildhoodEventsForAge(ageGroup: AgeGroup): ChildhoodEventDef[] {
  return CHILDHOOD_EVENTS_BY_AGE_GROUP[ageGroup] ?? []
}

/**
 * Получить событие по ID
 */
export function getChildhoodEventById(id: string): ChildhoodEventDef | undefined {
  return ALL_CHILDHOOD_EVENTS.find(e => e.id === id)
}

/**
 * Получить все события с определённым chainTag
 */
export function getChildhoodEventsByChain(chainTag: string): ChildhoodEventDef[] {
  return ALL_CHILDHOOD_EVENTS.filter(e => e.chainTag === chainTag)
}

/**
 * Статистика детских событий
 */
export const CHILDHOOD_EVENTS_STATS = {
  total: ALL_CHILDHOOD_EVENTS.length,
  everyday: ALL_CHILDHOOD_EVENTS.filter(e => e.type === 'everyday').length,
  formative: ALL_CHILDHOOD_EVENTS.filter(e => e.type === 'formative').length,
  fateful: ALL_CHILDHOOD_EVENTS.filter(e => e.type === 'fateful').length,
  byAgeGroup: {
    infant: INFANT_EVENTS.length,
    preschool: PRESCHOOL_EVENTS.length,
    school: SCHOOL_EVENTS.length,
    teen: TEEN_EVENTS.length,
    young: YOUNG_EVENTS.length,
  },
}
