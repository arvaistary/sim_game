export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/game')) return
  if (event.method === 'OPTIONS') return

  if (!await isAuthenticated(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }
})
