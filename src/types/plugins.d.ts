declare module '#app' {
  interface NuxtApp {
    $autoSave: {
      enable: () => void
      flush: () => void
      clear: () => void
    }
  }
}

export {}
