import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: { alias: { '@': resolve(__dirname, '.') } },
})
