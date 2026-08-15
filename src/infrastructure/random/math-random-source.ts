import type { RandomSource } from '@/domain/game-world/random-source.types'

/**
 * Создать RandomSource поверх Math.random.
 * @description [Infrastructure] - адаптирует глобальный генератор случайных чисел к domain-контракту.
 * @return { RandomSource } источник случайных чисел на основе Math.random
 */
export function createMathRandomSource(): RandomSource {
  return {
    next(): number {
      return Math.random()
    },
  }
}
