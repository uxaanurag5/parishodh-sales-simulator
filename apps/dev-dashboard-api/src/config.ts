import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PORT = Number(process.env.PORT ?? 4100);
export const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:5180";

export const REPO_PATH = path.resolve(__dirname, "../../..", process.env.GIT_REPO_PATH ?? ".");

export const DATA_DIR = path.resolve(__dirname, "../.data");

function parseOwnerRepo(remoteUrl: string): string | null {
  const m = remoteUrl.trim().match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

let cachedRepo: string | null | undefined;
export function getGithubRepo(): string | null {
  if (process.env.GITHUB_REPO) return process.env.GITHUB_REPO;
  if (cachedRepo !== undefined) return cachedRepo;
  try {
    const url = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: REPO_PATH,
      encoding: "utf8",
    });
    cachedRepo = parseOwnerRepo(url);
  } catch {
    cachedRepo = null;
  }
  return cachedRepo;
}

let cachedToken: string | null | undefined;
export function getGithubToken(): string | null {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (cachedToken !== undefined) return cachedToken;
  try {
    cachedToken = execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim() || null;
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

export const ANTHROPIC_ADMIN_API_KEY = process.env.ANTHROPIC_ADMIN_API_KEY ?? "";
