export default defineNuxtConfig({
  compatibilityDate: '2026-04-10',
  ssr: false,
  srcDir: 'src/',
  dir: {
    pages: 'nuxt-pages',
  },
  css: ['~/assets/css/main.css'],
  modules: ['@pinia/nuxt', '@nuxtjs/color-mode'],
  typescript: {
    strict: false,
    typeCheck: true,
  },
  app: {
    head: {
      title: 'Game Life',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Cozy turn-based life simulator' },
      ],
    },
  },
  devtools: { enabled: true },
})
