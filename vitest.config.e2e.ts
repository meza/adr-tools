import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: 'tests',
    testTimeout: 10000,
    isolate: true,
    globalSetup: 'tests/global-setup.ts',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    watch: false,
    coverage: {
      reportsDirectory: './reports/coverage/e2e',
      reporter: ['text', 'json', 'html']
    }
  }
});
