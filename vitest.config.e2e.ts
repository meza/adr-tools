import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: 'tests',
    testTimeout: 30000,
    hookTimeout: 30000,
    watch: false,
    coverage: {
      reportsDirectory: './reports/coverage/e2e',
      reporter: ['text', 'json', 'html']
    }
  }
});
