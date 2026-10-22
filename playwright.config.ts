import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Dedicated, throwaway database so e2e runs never touch a developer's real
// dev.db (seeded with its own data on every run — see global-setup.ts).
export const E2E_DATABASE_URL = `file:${path.resolve(__dirname, "apps/api/prisma/e2e.db").replace(/\\/g, "/")}`;

const sharedServerEnv = {
  DATABASE_URL: E2E_DATABASE_URL,
  // Scripted-mode timing is "realistic" by default (CLAUDE.md), which would
  // make the scripted-flow spec take well over a minute. Speed it up, same
  // values as apps/api/vitest.setup.ts.
  SCRIPTED_CHARS_PER_SEC: "4000",
  SCRIPTED_THINK_MS: "5",
  RINGING_DELAY_MIN_MS: "20",
  RINGING_DELAY_MAX_MS: "40",
  MIN_LEARNER_TURN_INTERVAL_MS: "0",
};

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Starts its own dev servers against the dedicated e2e database — stop any
  // manually-running `pnpm dev` first, since both would otherwise fight over
  // ports 4000/5173.
  webServer: [
    {
      command: "pnpm --filter @parishodh/api dev",
      url: "http://localhost:4000/api/health",
      reuseExistingServer: false,
      env: sharedServerEnv,
      timeout: 30_000,
    },
    {
      command: "pnpm --filter @parishodh/web dev",
      url: "http://localhost:5173",
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
