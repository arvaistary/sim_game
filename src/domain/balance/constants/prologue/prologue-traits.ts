/** Allow-list черт, которые пролог может выдать (≤ maxTraitsGranted). */
export const PROLOGUE_TRAIT_ALLOW_LIST: readonly string[] = [
  'curious',
  'creative',
  'disciplined',
  'friendly',
  'cautious',
  'organized',
  'honestToBone',
  'compassionate',
  'tough',
  'selfSufficient',
] as const

/** Русские подписи черт пролога для UI. */
export const PROLOGUE_TRAIT_LABELS: Record<string, string> = {
  curious: 'Любопытный',
  creative: 'Творческий',
  disciplined: 'Дисциплинированный',
  friendly: 'Дружелюбный',
  cautious: 'Осторожный',
  organized: 'Организованный',
  honestToBone: 'Честный',
  compassionate: 'Отзывчивый',
  tough: 'Стойкий',
  selfSufficient: 'Самостоятельный',
}

/**
 * @description [Prologue] - Проверяет, можно ли выдать черту из allow-list.
 * @return { boolean } true если черта разрешена
 */
export function isPrologueTraitAllowed(traitId: string): boolean {
  return PROLOGUE_TRAIT_ALLOW_LIST.includes(traitId)
}

/**
 * @description [Prologue] - Русская подпись черты.
 * @return { string } label
 */
export function getPrologueTraitLabel(traitId: string): string {
  return PROLOGUE_TRAIT_LABELS[traitId] ?? traitId
}
