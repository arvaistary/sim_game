import { resolve } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2026-04-10',
  ssr: false,
  srcDir: 'src/',

  // CSS: SCSS-based design system
  css: [
    '~/assets/scss/reset.scss',
    '~/assets/scss/global.scss',
    '~/assets/scss/transitions.scss',
  ],

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
  ],

  // Components auto-import: short names without directory prefixes
  components: [
    { path: '~/components/global', pathPrefix: false },
    { path: '~/components/game', pathPrefix: false },
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/layout', pathPrefix: false },
    { path: '~/components/pages', pathPrefix: false },
  ],

  colorMode: {
    preference: 'light',
    dataValue: 'theme',
    classSuffix: '',
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  imports: {
    dirs: [
      'stores',
      'composables/*/index.{ts,js,mjs,mts}',
      'shared/types',
    ],
  },

  // SCSS preprocessor options: make variables & mixins globally available
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/assets/scss/variables.scss" as *;
            @use "@/assets/scss/mixins.scss" as *;
          `,
        },
      },
    },
  },

  // Aliases
  alias: {
    '@components': resolve(__dirname, 'src/components'),
    '@stores': resolve(__dirname, 'src/stores'),
    '@composables': resolve(__dirname, 'src/composables'),
    '@domain': resolve(__dirname, 'src/domain'),
    '@application': resolve(__dirname, 'src/application'),
    '@utils': resolve(__dirname, 'src/utils'),
    '@constants': resolve(__dirname, 'src/constants'),
    '@infrastructure': resolve(__dirname, 'src/infrastructure'),
    '@pages': resolve(__dirname, 'src/pages'),
    '@shared': resolve(__dirname, 'shared'),
  },

  // App head
  app: {
    head: {
      title: 'Game Life',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Cozy turn-based life simulator' },
      ],
      // Preload Inter font
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: 'anonymous',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  devtools: { enabled: true },
})
