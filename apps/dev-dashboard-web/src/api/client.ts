import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export interface GitSummary {
  authorName: string;
  authorEmail: string;
  totalCommits: number;
  commitsInRange: number;
  linesAdded: number;
  linesDeleted: number;
  dailyCommits: { date: string; count: number }[];
  recentCommits: { sha: string; message: string; date: string; additions: number; deletions: number }[];
}

export interface GithubSummary {
  configured: boolean;
  reason?: string;
  owner?: string;
  repo?: string;
  login?: string;
  openPRs?: number;
  mergedPRs?: number;
  prsAuthored?: number;
  reviewsGiven?: number;
  recentActivity?: { type: "pr_merged" | "pr_opened" | "review"; title: string; url: string; date: string }[];
}

export interface ClaudeUsageSummary {
  configured: boolean;
  reason?: string;
  totalTokensIn?: number;
  totalTokensOut?: number;
  totalCostUsd?: number;
  daily?: { date: string; tokensIn: number; tokensOut: number; costUsd: number }[];
  byModel?: { model: string; tokensIn: number; tokensOut: number; costUsd: number }[];
}

export interface CoverageSummary {
  available: boolean;
  reason?: string;
  linesPct?: number;
  sources?: { app: string; pct: number }[];
}

export interface IntegrationStatus {
  configured: boolean;
  baseUrl?: string;
  email?: string;
}

export interface JiraSummary {
  configured: boolean;
  reason?: string;
  assignedOpen?: number;
  assignedDone?: number;
  recentIssues?: { key: string; summary: string; status: string; url: string }[];
}

export interface ConfluenceSummary {
  configured: boolean;
  reason?: string;
  pagesAuthored?: number;
  recentPages?: { title: string; url: string; when: string }[];
}

export interface CoworkActivity {
  status: "coming_soon";
  note: string;
}

export interface Credential {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export function useGitSummary(days: number) {
  return useQuery({
    queryKey: ["git-summary", days],
    queryFn: () => getJson<GitSummary>(`/api/git/summary?days=${days}`),
  });
}

export function useGithubSummary(days: number) {
  return useQuery({
    queryKey: ["github-summary", days],
    queryFn: () => getJson<GithubSummary>(`/api/github/summary?days=${days}`),
  });
}

export function useClaudeUsage(days: number) {
  return useQuery({
    queryKey: ["claude-usage", days],
    queryFn: () => getJson<ClaudeUsageSummary>(`/api/claude/usage?days=${days}`),
  });
}

export function useCoverage() {
  return useQuery({ queryKey: ["coverage"], queryFn: () => getJson<CoverageSummary>("/api/quality/coverage") });
}

export function useIntegrationsStatus() {
  return useQuery({
    queryKey: ["integrations-status"],
    queryFn: () => getJson<{ jira: IntegrationStatus; confluence: IntegrationStatus }>("/api/integrations/status"),
  });
}

export function useJiraSummary(enabled: boolean) {
  return useQuery({
    queryKey: ["jira-summary"],
    queryFn: () => getJson<JiraSummary>("/api/integrations/jira/summary"),
    enabled,
  });
}

export function useConfluenceSummary(enabled: boolean) {
  return useQuery({
    queryKey: ["confluence-summary"],
    queryFn: () => getJson<ConfluenceSummary>("/api/integrations/confluence/summary"),
    enabled,
  });
}

export function useCoworkActivity() {
  return useQuery({ queryKey: ["cowork"], queryFn: () => getJson<CoworkActivity>("/api/cowork/activity") });
}

async function saveCredential(kind: "jira" | "confluence", credential: Credential) {
  const res = await fetch(`/api/integrations/${kind}/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credential),
  });
  return res.json() as Promise<{ ok: boolean; message: string; configured: boolean }>;
}

async function clearCredential(kind: "jira" | "confluence") {
  const res = await fetch(`/api/integrations/${kind}/config`, { method: "DELETE" });
  return res.json() as Promise<{ configured: boolean }>;
}

export function useSaveCredential(kind: "jira" | "confluence") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (credential: Credential) => saveCredential(kind, credential),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["integrations-status"] });
      void qc.invalidateQueries({ queryKey: [`${kind}-summary`] });
    },
  });
}

export function useClearCredential(kind: "jira" | "confluence") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearCredential(kind),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["integrations-status"] });
      void qc.invalidateQueries({ queryKey: [`${kind}-summary`] });
    },
  });
}
