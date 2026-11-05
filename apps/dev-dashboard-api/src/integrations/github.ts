import { getGithubRepo, getGithubToken } from "../config.js";

const API = "https://api.github.com";

async function ghFetch<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${url}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export interface GithubSummary {
  configured: boolean;
  reason?: string;
  owner?: string;
  repo?: string;
  login?: string;
  branch?: string;
  openPRs?: number;
  mergedPRs?: number;
  prsAuthored?: number;
  reviewsGiven?: number;
  recentActivity?: { type: "pr_merged" | "pr_opened" | "review"; title: string; url: string; date: string }[];
}

interface SearchIssue {
  title: string;
  html_url: string;
  updated_at: string;
  pull_request?: { merged_at: string | null };
}

export async function getGithubBranches(): Promise<string[]> {
  const token = getGithubToken();
  const repo = getGithubRepo();
  if (!token || !repo) return [];
  try {
    const branches = await ghFetch<{ name: string }[]>(`${API}/repos/${repo}/branches?per_page=100`, token);
    return branches.map((b) => b.name);
  } catch {
    return [];
  }
}

export async function getGithubSummary(days: number, branch?: string): Promise<GithubSummary> {
  const token = getGithubToken();
  const repo = getGithubRepo();
  if (!token) return { configured: false, reason: "No GITHUB_TOKEN and `gh auth token` is unavailable." };
  if (!repo) return { configured: false, reason: "Could not resolve an owner/repo from the `origin` git remote." };
  const [owner, repoName] = repo.split("/");

  let login: string;
  try {
    const user = await ghFetch<{ login: string }>(`${API}/user`, token);
    login = user.login;
  } catch (err) {
    return { configured: false, reason: `GitHub token rejected: ${(err as Error).message}` };
  }

  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const baseFilter = branch ? `+base:${branch}` : "";

  const [authored, reviewed, openPrs] = await Promise.all([
    ghFetch<{ total_count: number; items: SearchIssue[] }>(
      `${API}/search/issues?q=repo:${repo}+type:pr+author:${login}${baseFilter}+updated:>=${since}&sort=updated&order=desc&per_page=20`,
      token,
    ),
    ghFetch<{ total_count: number; items: SearchIssue[] }>(
      `${API}/search/issues?q=repo:${repo}+type:pr+reviewed-by:${login}${baseFilter}+updated:>=${since}&sort=updated&order=desc&per_page=20`,
      token,
    ),
    ghFetch<{ total_count: number }>(`${API}/search/issues?q=repo:${repo}+type:pr+state:open${baseFilter}`, token),
  ]);

  const mergedAuthored = authored.items.filter((i) => i.pull_request?.merged_at);

  const recentActivity: GithubSummary["recentActivity"] = [
    ...mergedAuthored.map((i) => ({
      type: "pr_merged" as const,
      title: i.title,
      url: i.html_url,
      date: i.pull_request?.merged_at ?? i.updated_at,
    })),
    ...authored.items
      .filter((i) => !i.pull_request?.merged_at)
      .map((i) => ({ type: "pr_opened" as const, title: i.title, url: i.html_url, date: i.updated_at })),
    ...reviewed.items.map((i) => ({ type: "review" as const, title: i.title, url: i.html_url, date: i.updated_at })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  return {
    configured: true,
    owner,
    repo: repoName,
    login,
    branch,
    openPRs: openPrs.total_count,
    mergedPRs: mergedAuthored.length,
    prsAuthored: authored.total_count,
    reviewsGiven: reviewed.total_count,
    recentActivity,
  };
}
