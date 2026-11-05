import { execFileSync } from "node:child_process";
import { REPO_PATH } from "../config.js";

export interface CommitRecord {
  sha: string;
  message: string;
  date: string;
  additions: number;
  deletions: number;
}

export interface GitSummary {
  branch: string;
  authorName: string;
  authorEmail: string;
  totalCommits: number;
  commitsInRange: number;
  linesAdded: number;
  linesDeleted: number;
  dailyCommits: { date: string; count: number }[];
  recentCommits: CommitRecord[];
}

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: REPO_PATH, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
}

function getConfiguredIdentity(): { name: string; email: string } {
  const name = git(["log", "-1", "--format=%an"]).trim() || git(["config", "user.name"]).trim() || "Anurag Uxa";
  const email = (() => {
    try {
      return git(["config", "user.email"]).trim();
    } catch {
      return "";
    }
  })();
  return { name, email };
}

export function getCurrentBranch(): string {
  try {
    const name = git(["branch", "--show-current"]).trim();
    if (name) return name;
  } catch {
    // detached HEAD or similar — fall through
  }
  return "HEAD";
}

export interface BranchInfo {
  name: string;
  isCurrent: boolean;
}

export function listBranches(): BranchInfo[] {
  const current = getCurrentBranch();
  const seen = new Set<string>();
  const branches: BranchInfo[] = [];

  const addRaw = (raw: string) => {
    const name = raw
      .trim()
      .replace(/^origin\//, "")
      .replace(/^remotes\/origin\//, "");
    if (!name || name === "HEAD" || seen.has(name)) return;
    seen.add(name);
    branches.push({ name, isCurrent: name === current });
  };

  try {
    git(["for-each-ref", "--format=%(refname:short)", "refs/heads/"])
      .split("\n")
      .forEach(addRaw);
  } catch {
    // no local branches yet
  }
  try {
    git(["for-each-ref", "--format=%(refname)", "refs/remotes/origin/"])
      .split("\n")
      .filter((raw) => !raw.endsWith("/HEAD"))
      .map((raw) => raw.replace(/^refs\/remotes\//, ""))
      .forEach(addRaw);
  } catch {
    // no remote-tracking branches fetched locally
  }
  if (branches.length === 0) branches.push({ name: current, isCurrent: true });
  return branches;
}

/** Resolves a user-chosen branch name to a ref git can actually log, trying the
 * local branch first and falling back to its remote-tracking counterpart. */
function resolveRef(branch: string | undefined): string {
  if (!branch) return getCurrentBranch();
  for (const candidate of [branch, `origin/${branch}`]) {
    try {
      git(["rev-parse", "--verify", "--quiet", candidate]);
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`Unknown branch "${branch}".`);
}

const SEP = "\u0001";

export function getGitSummary(days: number, branch?: string): GitSummary {
  const ref = resolveRef(branch);
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { name, email } = getConfiguredIdentity();

  const totalCommits = Number(git(["rev-list", "--count", ref]).trim() || "0");

  const log = git(["log", ref, `--since=${since}`, `--format=%H${SEP}%an${SEP}%aI${SEP}%s`, "--numstat"]);

  const commits: CommitRecord[] = [];
  const dailyMap = new Map<string, number>();
  let linesAdded = 0;
  let linesDeleted = 0;

  const lines = log.split("\n");
  let current: CommitRecord | null = null;
  for (const line of lines) {
    if (line.includes(SEP)) {
      if (current) commits.push(current);
      const [sha, , date, message] = line.split(SEP);
      current = { sha: (sha ?? "").slice(0, 7), message: message ?? "", date: date ?? "", additions: 0, deletions: 0 };
      const day = (date ?? "").slice(0, 10);
      if (day) dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    } else if (line.trim() && current) {
      const [add, del] = line.split("\t");
      const a = Number(add) || 0;
      const d = Number(del) || 0;
      current.additions += a;
      current.deletions += d;
      linesAdded += a;
      linesDeleted += d;
    }
  }
  if (current) commits.push(current);

  const dailyCommits: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    dailyCommits.push({ date: d, count: dailyMap.get(d) ?? 0 });
  }

  return {
    branch: branch ?? getCurrentBranch(),
    authorName: name,
    authorEmail: email,
    totalCommits,
    commitsInRange: commits.length,
    linesAdded,
    linesDeleted,
    dailyCommits,
    recentCommits: commits.slice(0, 10),
  };
}
