import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { E2E_DATABASE_URL } from "../playwright.config";

const apiDir = path.resolve(__dirname, "../apps/api");
const e2eDbPath = path.resolve(__dirname, "../apps/api/prisma/e2e.db");

function run(command: string): string {
  return execSync(command, {
    cwd: apiDir,
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    encoding: "utf8",
  });
}

export default async function globalSetup() {
  // Fresh database on every run, so fixtures (and their session ids) are
  // never stale from a previous run.
  if (existsSync(e2eDbPath)) rmSync(e2eDbPath);

  // Not `prisma generate` here — the webServer processes Playwright starts
  // (tsx watch) hold the generated client's native binary open on Windows,
  // and regenerating while they're already running fails with EPERM. The
  // client is generated once, up front, by the "test:e2e" script itself,
  // before `playwright test` (and therefore any webServer) starts.
  run("pnpm exec prisma migrate deploy");
  run("pnpm exec tsx prisma/seed.ts");
  const fixturesOutput = run("pnpm exec tsx prisma/e2eFixtures.ts");

  const jsonLine = fixturesOutput
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("{"));
  if (!jsonLine) {
    throw new Error(`e2eFixtures.ts produced no parseable output:\n${fixturesOutput}`);
  }
  const { scriptedSessionId, assessmentSessionId } = JSON.parse(jsonLine) as {
    scriptedSessionId: string;
    assessmentSessionId: string;
  };

  process.env.E2E_SCRIPTED_SESSION_ID = scriptedSessionId;
  process.env.E2E_ASSESSMENT_SESSION_ID = assessmentSessionId;
}
