import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    // Environment
    environment: 'node',

    // Pool fix for Node 24 compatibility
    pool: 'forks',
    poolOptions: {
      forks: {
        execArgv: ['--experimental-vm-modules'],
      },
    },

    // Test discovery
    include: ['test/**/*.test.ts'],
    exclude: [
      '**/.kilo/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
    ],

    // Globals
    globals: true,

    // Setup files
    setupFiles: ['test/setup/localStorage.mock.ts'],

    // Timeout
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '~': resolve(__dirname, 'src'),
      '@constants': resolve(__dirname, 'src/constants/index.ts'),
      '@utils': resolve(__dirname, 'src/utils/index.ts'),
      '@domain': resolve(__dirname, 'src/domain'),
      '@application': resolve(__dirname, 'src/application'),
      '@composables': resolve(__dirname, 'src/composables/index.ts'),
    },
  },
})
