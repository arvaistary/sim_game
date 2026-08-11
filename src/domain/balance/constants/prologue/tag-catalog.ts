import type { PrologueTagId, PrologueTagPoints } from '@/domain/prologue/prologue.types'

export const PROLOGUE_TAG_IDS: readonly PrologueTagId[] = [
  'stem',
  'lingua',
  'social',
  'discipline',
  'body',
  'creative',
  'practical',
  'curiosity',
] as const

export const PROLOGUE_TAG_LABELS: Record<PrologueTagId, string> = {
  stem: 'Точные науки',
  lingua: 'Язык',
  social: 'Общение',
  discipline: 'Дисциплина',
  body: 'Тело',
  creative: 'Творчество',
  practical: 'Практика',
  curiosity: 'Любопытство',
}

/**
 * @description [Prologue] - Пустой словарь очков тегов.
 * @return { PrologueTagPoints } нули по всем тегам
 */
export function createEmptyTagPoints(): PrologueTagPoints {
  return {
    stem: 0,
    lingua: 0,
    social: 0,
    discipline: 0,
    body: 0,
    creative: 0,
    practical: 0,
    curiosity: 0,
  }
}
