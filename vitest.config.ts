import { defineConfig } from 'vitest/config'

// Tests de lógica pura (sin DOM), como los de la app móvil de los que se portaron.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'api/**/*.test.js'],
  },
})
