import type { RandomSource } from '@/domain/game-world/random-source.types'

/**
 * Создать детерминированный RandomSource для тестов.
 * @description [Test] - возвращает значения из sequence по порядку, затем стабильно отдаёт 0.
 * @return { RandomSource } фейковый источник случайных чисел
 */
export function createFakeRandomSource(sequence: number[]): RandomSource {
  let currentIndex: number = 0

  return {
    next(): number {
      const nextValue: number | undefined = sequence[currentIndex]

      currentIndex += 1

      return nextValue ?? 0
    },
  }
}
