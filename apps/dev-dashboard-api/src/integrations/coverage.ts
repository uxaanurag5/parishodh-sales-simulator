import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { REPO_PATH } from "../config.js";

interface CoverageSummaryFile {
  total: { lines: { pct: number }; statements: { pct: number }; branches: { pct: number } };
}

export interface CoverageSummary {
  available: boolean;
  reason?: string;
  linesPct?: number;
  sources?: { app: string; pct: number }[];
}

const SOURCES = [
  { app: "@parishodh/api", file: "apps/api/coverage/coverage-summary.json" },
  { app: "@parishodh/web", file: "apps/web/coverage/coverage-summary.json" },
];

export function getCoverageSummary(): CoverageSummary {
  const found: { app: string; pct: number }[] = [];
  for (const s of SOURCES) {
    const full = path.join(REPO_PATH, s.file);
    if (!existsSync(full)) continue;
    try {
      const json = JSON.parse(readFileSync(full, "utf8")) as CoverageSummaryFile;
      found.push({ app: s.app, pct: json.total.lines.pct });
    } catch {
      // ignore malformed file
    }
  }
  if (found.length === 0) {
    return {
      available: false,
      reason: "No coverage-summary.json found. Run `pnpm test -- --coverage` in apps/api or apps/web to generate one.",
    };
  }
  const linesPct = found.reduce((sum, f) => sum + f.pct, 0) / found.length;
  return { available: true, linesPct, sources: found };
}
