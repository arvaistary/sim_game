import { getHeader, sendNoContent, setResponseHeaders } from 'h3'

export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/game')) return

  const config = useRuntimeConfig()
  const origin = getHeader(event, 'origin')
  const allowedOrigins = String(config.gameCorsOrigin ?? '')
    .split(',')
    .map((value: string) => value.trim())
    .filter(Boolean)

  if (origin && allowedOrigins.includes(origin)) {
    setResponseHeaders(event, {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      vary: 'Origin',
    })
  }

  if (event.method === 'OPTIONS') return sendNoContent(event)
})
