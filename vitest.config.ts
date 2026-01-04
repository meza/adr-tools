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
      reportsDirectory: './reports/coverage/unit',
      reporter: ['text', 'json', 'html']
    }
  }
});
