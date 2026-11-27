import { defineConfig } from 'vitest/config';

// Unit tests for pure logic (AI Copilot Wave 1). Kept separate from vite.config.ts
// so the production build config is untouched.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
