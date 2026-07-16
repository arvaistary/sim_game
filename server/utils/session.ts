/**
 * Session management для Nitro Server API (server-first migration, Stage 4).
 *
 * Хранит GameWorld per-session в Nitro storage. SessionId — cookie-based,
 * TTL 24 часа. Это in-memory/db storage; для прод-сервера заменится на Redis/DB.
 */
import type { H3Event } from 'h3'
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'

const SESSION_COOKIE: string = 'gl_session'
const SESSION_TTL_SECONDS: number = 86400 // 24 часа

/**
 * Получить sessionId из cookie или создать новый.
 * @description [Server] - session utils.
 * @param event H3Event
 * @return { string } sessionId
 */
export function getOrCreateSessionId(event: H3Event): string {
  const existing: string | undefined = getCookie(event, SESSION_COOKIE)

  if (existing) return existing

  const sessionId: string = generateSessionId()
  const config = useRuntimeConfig()
  const sameSite = String(config.gameCookieSameSite ?? 'lax') as 'lax' | 'strict' | 'none'
  const secure = config.gameCookieSecure === true || String(config.gameCookieSecure) === 'true'
  setCookie(event, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  })
  return sessionId
}

/**
 * Сгенерировать уникальный sessionId.
 * @description [Server] - session utils.
 * @return { string }
 */
export function generateSessionId(): string {
  return crypto.randomUUID()
}

/**
 * Сохранить GameWorld для session.
 * @description [Server] - persistence.
 * @param sessionId id сессии
 * @param world мир для сохранения
 * @return { Promise<void> }
 */
export async function saveWorldForSession(sessionId: string, world: GameWorld): Promise<void> {
  const storage = useStorage('game-sessions')
  const json: GameWorldJSON = world.toJSON()
  await storage.setItem(sessionKey(sessionId), json, { ttl: SESSION_TTL_SECONDS })
}

/**
 * Загрузить GameWorld для session.
 * @description [Server] - persistence.
 * @param sessionId id сессии
 * @return { Promise<GameWorld | null> } мир или null если сессия не найдена
 */
export async function loadWorldForSession(sessionId: string): Promise<GameWorld | null> {
  const storage = useStorage('game-sessions')
  const raw: GameWorldJSON | null = await storage.getItem<GameWorldJSON>(sessionKey(sessionId))

  if (!raw) return null
  return GameWorld.fromJSON(raw)
}

/**
 * Удалить сессию (logout / reset).
 * @description [Server] - persistence cleanup.
 * @param sessionId id сессии
 * @return { Promise<void> }
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const storage = useStorage('game-sessions')
  await storage.removeItem(sessionKey(sessionId))
}

/**
 * Очистить истёкшие сессии (cron-job вызов).
 * Nitro storage с TTL сам удаляет, но для явного cleanup.
 * @description [Server] - maintenance.
 * @return { Promise<void> }
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const storage = useStorage('game-sessions')
  const keys: string[] = await storage.getKeys('session:')

  for (const key of keys) {
    const data: GameWorldJSON | null = await storage.getItem<GameWorldJSON>(key)

    if (!data) await storage.removeItem(key)
  }
}

function sessionKey(sessionId: string): string {
  return `session:${sessionId}`
}
