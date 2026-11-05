import type { Credential } from "../settings/store.js";

function authHeader(c: Credential): string {
  return `Basic ${Buffer.from(`${c.email}:${c.apiToken}`).toString("base64")}`;
}

export async function testConfluenceConnection(c: Credential): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${c.baseUrl.replace(/\/$/, "")}/wiki/rest/api/space?limit=1`, {
      headers: { Authorization: authHeader(c), Accept: "application/json" },
    });
    if (!res.ok) return { ok: false, message: `Confluence rejected the request (HTTP ${res.status}).` };
    return { ok: true, message: "Connected." };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export interface ConfluenceSummary {
  configured: boolean;
  reason?: string;
  pagesAuthored?: number;
  recentPages?: { title: string; url: string; when: string }[];
}

export async function getConfluenceSummary(c: Credential | undefined): Promise<ConfluenceSummary> {
  if (!c) return { configured: false, reason: "Confluence is not configured yet." };
  const base = c.baseUrl.replace(/\/$/, "");
  const headers = { Authorization: authHeader(c), Accept: "application/json" };

  try {
    const cql = "contributor = currentUser() order by lastmodified desc";
    const res = await fetch(`${base}/wiki/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=10`, {
      headers,
    });
    if (!res.ok) throw new Error(`Confluence search failed (HTTP ${res.status})`);
    const json = (await res.json()) as { size: number; results: { title: string; _links: { webui: string } }[] };

    return {
      configured: true,
      pagesAuthored: json.size,
      recentPages: json.results.slice(0, 6).map((p) => ({
        title: p.title,
        url: `${base}${p._links.webui}`,
        when: "recently",
      })),
    };
  } catch (err) {
    return { configured: false, reason: (err as Error).message };
  }
}
