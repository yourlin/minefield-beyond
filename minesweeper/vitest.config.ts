import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
    },
  },
  test: {
    include: ['src/core/**/*.test.ts', 'src/verifier/**/*.test.ts', 'src/game/**/*.test.ts'],
    globals: true,
  },
});
