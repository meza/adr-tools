import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 10000,
    watch: false,
    coverage: {
      reportsDirectory: './reports/coverage',
      reporter: ['text', 'json', 'html']
    }
  }
});
