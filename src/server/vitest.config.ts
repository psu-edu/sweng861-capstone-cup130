import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    include: [
      'tests/**/*.test.ts',
    ],

    globalSetup: [
      './tests/setup/global-setup.ts',
    ],

    setupFiles: [
      './tests/setup/setup-test-environment.ts',
    ],

    fileParallelism: false,
  },
});