import type { Credential } from "../settings/store.js";

function authHeader(c: Credential): string {
  return `Basic ${Buffer.from(`${c.email}:${c.apiToken}`).toString("base64")}`;
}

export async function testJiraConnection(c: Credential): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${c.baseUrl.replace(/\/$/, "")}/rest/api/3/myself`, {
      headers: { Authorization: authHeader(c), Accept: "application/json" },
    });
    if (!res.ok) return { ok: false, message: `Jira rejected the request (HTTP ${res.status}).` };
    const me = (await res.json()) as { displayName?: string };
    return { ok: true, message: `Connected as ${me.displayName ?? c.email}.` };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export interface JiraSummary {
  configured: boolean;
  reason?: string;
  assignedOpen?: number;
  assignedDone?: number;
  recentIssues?: { key: string; summary: string; status: string; url: string }[];
}

export async function getJiraSummary(c: Credential | undefined): Promise<JiraSummary> {
  if (!c) return { configured: false, reason: "Jira is not configured yet." };
  const base = c.baseUrl.replace(/\/$/, "");
  const headers = { Authorization: authHeader(c), Accept: "application/json" };

  async function count(jql: string): Promise<number> {
    const res = await fetch(`${base}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=0`, { headers });
    if (!res.ok) throw new Error(`Jira search failed (HTTP ${res.status})`);
    return ((await res.json()) as { total: number }).total;
  }

  try {
    const [assignedOpen, assignedDone] = await Promise.all([
      count("assignee = currentUser() AND statusCategory != Done"),
      count("assignee = currentUser() AND statusCategory = Done"),
    ]);

    const recentRes = await fetch(
      `${base}/rest/api/3/search?jql=${encodeURIComponent("assignee = currentUser() ORDER BY updated DESC")}&maxResults=6&fields=summary,status`,
      { headers },
    );
    const recentJson = (await recentRes.json()) as {
      issues: { key: string; fields: { summary: string; status: { name: string } } }[];
    };
    const recentIssues = recentJson.issues.map((i) => ({
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status.name,
      url: `${base}/browse/${i.key}`,
    }));

    return { configured: true, assignedOpen, assignedDone, recentIssues };
  } catch (err) {
    return { configured: false, reason: (err as Error).message };
  }
}
