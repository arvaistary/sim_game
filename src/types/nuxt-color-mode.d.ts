declare module 'nuxt/schema' {
  interface NuxtConfig {
    colorMode?: NuxtColorModeOptions
  }

  interface NuxtConfigInput {
    colorMode?: NuxtColorModeOptions
  }
}

interface NuxtColorModeOptions {
  preference?: 'system' | 'light' | 'dark' | 'sepia' | string
  fallback?: string
  globalName?: string
  componentName?: string
  classPrefix?: string
  classSuffix?: string
  storage?: 'localStorage' | 'sessionStorage' | 'cookie'
  storageKey?: string
  dataValue?: string
  cookieAttrs?: Record<string, string>
}
