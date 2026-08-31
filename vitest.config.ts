import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    // .tsx so a component test can render real React. The environment stays
    // node by default -- the database tests need it, and booting jsdom for
    // every PGlite file would be pure cost. A component test opts itself in
    // with an `@vitest-environment jsdom` docblock.
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // PGlite instances are per-file; give the WASM boot room on a cold run.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
