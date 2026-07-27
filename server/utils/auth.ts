import type { H3Event } from 'h3'

const AUTH_COOKIE = 'gl_auth'
const AUTH_TTL_SECONDS = 60 * 60 * 24 * 30

interface AuthSession {
  createdAt: string
}

export async function createAuthSession(event: H3Event): Promise<void> {
  const sessionId = crypto.randomUUID()
  const storage = useStorage('auth-sessions')

  await storage.setItem<AuthSession>(authSessionKey(sessionId), {
    createdAt: new Date().toISOString(),
  }, { ttl: AUTH_TTL_SECONDS })

  const config = useRuntimeConfig()
  const sameSite = String(config.gameCookieSameSite ?? 'lax') as 'lax' | 'strict' | 'none'
  const secure = config.gameCookieSecure === true || String(config.gameCookieSecure) === 'true'

  setCookie(event, AUTH_COOKIE, sessionId, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: AUTH_TTL_SECONDS,
    path: '/',
  })
}

export async function isAuthenticated(event: H3Event): Promise<boolean> {
  const sessionId = getCookie(event, AUTH_COOKIE)
  if (!sessionId) return false

  const session = await useStorage('auth-sessions').getItem<AuthSession>(authSessionKey(sessionId))
  return Boolean(session?.createdAt)
}

export async function clearAuthSession(event: H3Event): Promise<void> {
  const sessionId = getCookie(event, AUTH_COOKIE)
  if (sessionId) {
    await useStorage('auth-sessions').removeItem(authSessionKey(sessionId))
  }

  deleteCookie(event, AUTH_COOKIE, { path: '/' })
}

function authSessionKey(sessionId: string): string {
  return `session:${sessionId}`
}
