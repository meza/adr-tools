import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: 'src',
    testTimeout: 30000,
    hookTimeout: 30000,
    watch: false,
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true
      }
    },
    coverage: {
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
        perFile: true
      },
      reportsDirectory: './reports/coverage/unit',
      reporter: ['text', 'json', 'html']
    }
  }
});
