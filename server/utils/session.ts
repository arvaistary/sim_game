/**
 * Session management для Nitro Server API (server-first migration, Stage 4).
 *
 * Хранит GameWorld per-session в Nitro storage. SessionId — cookie-based,
 * TTL 24 часа. Это in-memory/db storage; для прод-сервера заменится на Redis/DB.
 */
import type { H3Event } from 'h3'
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import { getPersistenceRepository } from './persistence'

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
  setSessionCookie(event, sessionId)
  return sessionId
}

/** Issue a new cookie-backed game session, making any prior world unreachable. */
export function rotateSessionId(event: H3Event): string {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
  const sessionId: string = generateSessionId()
  setSessionCookie(event, sessionId)
  return sessionId
}

function setSessionCookie(event: H3Event, sessionId: string): void {
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
  const json: GameWorldJSON = world.toJSON()
  const repository = getPersistenceRepository()
  const existing = await repository.findByPlayerId(sessionId)
  if (!existing) {
    const now = new Date()
    await repository.create({
      sessionId,
      playerId: sessionId,
      state: json,
      schemaVersion: 1,
      stateVersion: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
    })
    return
  }
  await repository.saveIfVersionMatches(existing.sessionId, existing.stateVersion, json)
}

/**
 * Загрузить GameWorld для session.
 * @description [Server] - persistence.
 * @param sessionId id сессии
 * @return { Promise<GameWorld | null> } мир или null если сессия не найдена
 */
export async function loadWorldForSession(sessionId: string): Promise<GameWorld | null> {
  const record = await getPersistenceRepository().findByPlayerId(sessionId)
  const raw: GameWorldJSON | null = record?.state ?? null

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
  void sessionId
}

/**
 * Очистить истёкшие сессии (cron-job вызов).
 * Nitro storage с TTL сам удаляет, но для явного cleanup.
 * @description [Server] - maintenance.
 * @return { Promise<void> }
 */
export async function cleanupExpiredSessions(): Promise<void> {
  return
}
