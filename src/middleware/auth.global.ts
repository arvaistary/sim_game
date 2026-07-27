import type { AuthSessionResponse } from './auth.types'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const session: AuthSessionResponse = await $fetch<AuthSessionResponse>('/api/auth/session').catch(() => ({
    authenticated: false,
  }))

  if (session.authenticated) return

  return navigateTo({
    path: '/login',
    query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
  })
})
