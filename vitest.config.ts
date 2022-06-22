import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    coverage: {
      reportsDirectory: './reports/coverage',
      reporter: ['text', 'json', 'html']
    }
  }
});
