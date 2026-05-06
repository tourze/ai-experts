import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.mjs"],
    environment: "node",
    testTimeout: 60_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      include: ["src/build.ts", "src/build/**/*.ts"],
      all: true,
      thresholds: {
        perFile: true,
        statements: 70,
        branches: 50,
        functions: 80,
        lines: 70,
      },
    },
  },
});
