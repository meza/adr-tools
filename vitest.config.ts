import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    root: path.resolve(__dirname, 'tests'),
    threads: false,
    maxConcurrency: 1,
    watch: false,
    coverage: {
      reportsDirectory: './reports/coverage',
      reporter: ['text', 'json', 'html']
    }
  }
});
