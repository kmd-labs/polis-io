import { defineConfig } from 'vitest/config';

// Unit tests for the framework-free parts: formatting, forecasts, rankings and simulation helpers.
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node'
  }
});
