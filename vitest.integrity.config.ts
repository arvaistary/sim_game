import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/tooling/integrity-e2e-lifecycle.spec.ts'],
    pool: 'forks',
    execArgv: ['--experimental-vm-modules'],
    testTimeout: 200_000,
  },
})
