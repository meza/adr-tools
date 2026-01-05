import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: 'src',
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'threads',
    watch: false,
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    poolOptions: {
      threads: {
        isolate: false,
        singleThread: true
      }
    },
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/*.d.ts'],
      all: false,
      processingConcurrency: 1,
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
