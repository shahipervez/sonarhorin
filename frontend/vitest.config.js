import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Deterministic date maths: unit tests run in UTC unless a test switches TZ itself.
process.env.TZ = "UTC";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    css: false,
    restoreMocks: true,
  },
});
