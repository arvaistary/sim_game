/**
 * Сравнение semver вида x.y.z для цепочки миграций.
 */

function parseSemver(v: string): [number, number, number] {
  const parts = String(v).split('.').map(p => Number.parseInt(p, 10))
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
}

/** true если a < b */
export function semverLt(a: string, b: string): boolean {
  const [a1, a2, a3] = parseSemver(a)
  const [b1, b2, b3] = parseSemver(b)
  if (a1 !== b1) return a1 < b1
  if (a2 !== b2) return a2 < b2
  return a3 < b3
}

/** Нормализованная версия для сравнения: пустая / отсутствующая трактуется как 0.0.0 */
export function effectiveSaveVersion(version: unknown): string {
  if (typeof version === 'string' && version.trim()) return version.trim()
  return '0.0.0'
}
