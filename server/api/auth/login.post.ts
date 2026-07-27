interface LoginBody {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body: LoginBody = await readBody<LoginBody>(event).catch(() => ({})) ?? {}
  const username = String(body.username ?? '')
  const password = String(body.password ?? '')

  if (!config.gameAuthUsername || !config.gameAuthPassword) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Access credentials are not configured',
    })
  }

  if (username !== String(config.gameAuthUsername) || password !== String(config.gameAuthPassword)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Неверный логин или пароль',
    })
  }

  await createAuthSession(event)
  return { authenticated: true }
})
