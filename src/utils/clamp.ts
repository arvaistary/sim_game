/**
 * @description Utils - ограничивает значение в диапазоне [min, max]
 * @return { number } ограниченное значение
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
