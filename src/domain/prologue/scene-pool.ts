import type {
  DrawFromPoolInput,
  SeededRng,
  WeightedDrawInput,
} from './prologue.types'

/**
 * @description [Prologue] - Создаёт детерминированный RNG из seed.
 * @return { SeededRng } генератор
 */
export function createSeededRng(seed: number): SeededRng {
  let state: number = seed >>> 0

  function next(): number {
    state = (state + 0x6D2B79F5) >>> 0
    let t: number = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  function nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) return 0

    return Math.floor(next() * maxExclusive)
  }

  return { next, nextInt }
}

/**
 * @description [Prologue] - Достаёт один элемент из пула без возврата (по excludeIds).
 * @return { T | null } выбранный элемент или null
 */
export function drawFromPool<T>(data: DrawFromPoolInput<T>): T | null {
  const available: T[] = data.items.filter(
    (item: T) => !data.excludeIds.includes(data.getId(item)),
  )

  if (available.length === 0) return null

  const index: number = data.rng.nextInt(available.length)

  return available[index] ?? null
}

/**
 * @description [Prologue] - Взвешенный draw (~70/25/5 через веса типов).
 * @return { T | null } выбранный элемент
 */
export function drawWeightedFromPool<T>(data: WeightedDrawInput<T>): T | null {
  const available: T[] = data.items.filter(
    (item: T) => !data.excludeIds.includes(data.getId(item)),
  )

  if (available.length === 0) return null

  let totalWeight: number = 0
  const weights: number[] = available.map(
    (item: T) => {
      const weight: number = Math.max(0, data.getWeight(item))
      totalWeight += weight

      return weight
    },
  )

  if (totalWeight <= 0) {
    return drawFromPool({
      items: available,
      rng: data.rng,
      excludeIds: [],
      getId: data.getId,
    })
  }

  let roll: number = data.rng.next() * totalWeight

  for (let index = 0; index < available.length; index += 1) {
    roll -= weights[index]!

    if (roll <= 0) return available[index]!
  }

  return available[available.length - 1]!
}
