import { ANTHROPIC_ADMIN_API_KEY } from "../config.js";

const API = "https://api.anthropic.com/v1/organizations";
const ANTHROPIC_VERSION = "2023-06-01";

async function adminFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ANTHROPIC_ADMIN_API_KEY}`,
      "anthropic-version": ANTHROPIC_VERSION,
    },
  });
  if (!res.ok) {
    throw new Error(`Anthropic Admin API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

interface UsageBucket {
  starting_at: string;
  ending_at: string;
  results: { model: string | null; uncached_input_tokens: number; output_tokens: number }[];
}
interface UsageReport {
  data: UsageBucket[];
  has_more: boolean;
  next_page: string | null;
}

interface CostBucket {
  starting_at: string;
  results: { amount: string; model: string | null; description: string | null }[];
}
interface CostReport {
  data: CostBucket[];
  has_more: boolean;
  next_page: string | null;
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

async function collectPages<T extends { has_more: boolean; next_page: string | null }>(
  baseUrl: string,
): Promise<T[]> {
  const pages: T[] = [];
  let url = baseUrl;
  for (let i = 0; i < 5; i += 1) {
    const page = await adminFetch<T>(url);
    pages.push(page);
    if (!page.has_more || !page.next_page) break;
    url = `${baseUrl}&page=${encodeURIComponent(page.next_page)}`;
  }
  return pages;
}

export async function getClaudeUsageSummary(days: number): Promise<ClaudeUsageSummary> {
  if (!ANTHROPIC_ADMIN_API_KEY) {
    return { configured: false, reason: "ANTHROPIC_ADMIN_API_KEY is not set on the dev-dashboard-api server." };
  }

  const limit = Math.min(Math.max(days, 1), 31);
  const startingAt = new Date(Date.now() - limit * 86_400_000).toISOString();

  try {
    const [usagePages, costPages] = await Promise.all([
      collectPages<UsageReport>(
        `${API}/usage_report/messages?starting_at=${encodeURIComponent(startingAt)}&bucket_width=1d&limit=${limit}&group_by[]=model`,
      ),
      collectPages<CostReport>(
        `${API}/cost_report?starting_at=${encodeURIComponent(startingAt)}&bucket_width=1d&limit=${limit}&group_by[]=description`,
      ),
    ]);

    const dailyMap = new Map<string, { tokensIn: number; tokensOut: number; costUsd: number }>();
    const modelMap = new Map<string, { tokensIn: number; tokensOut: number; costUsd: number }>();
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let totalCostUsd = 0;

    for (const page of usagePages) {
      for (const bucket of page.data) {
        const day = bucket.starting_at.slice(0, 10);
        const entry = dailyMap.get(day) ?? { tokensIn: 0, tokensOut: 0, costUsd: 0 };
        for (const r of bucket.results) {
          entry.tokensIn += r.uncached_input_tokens;
          entry.tokensOut += r.output_tokens;
          totalTokensIn += r.uncached_input_tokens;
          totalTokensOut += r.output_tokens;
          const model = r.model ?? "unknown";
          const m = modelMap.get(model) ?? { tokensIn: 0, tokensOut: 0, costUsd: 0 };
          m.tokensIn += r.uncached_input_tokens;
          m.tokensOut += r.output_tokens;
          modelMap.set(model, m);
        }
        dailyMap.set(day, entry);
      }
    }

    for (const page of costPages) {
      for (const bucket of page.data) {
        const day = bucket.starting_at.slice(0, 10);
        const entry = dailyMap.get(day) ?? { tokensIn: 0, tokensOut: 0, costUsd: 0 };
        for (const r of bucket.results) {
          const amount = Number(r.amount) || 0;
          entry.costUsd += amount;
          totalCostUsd += amount;
          const model = r.model ?? "unknown";
          const m = modelMap.get(model) ?? { tokensIn: 0, tokensOut: 0, costUsd: 0 };
          m.costUsd += amount;
          modelMap.set(model, m);
        }
        dailyMap.set(day, entry);
      }
    }

    const daily = [...dailyMap.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({ date, ...v }));
    const byModel = [...modelMap.entries()].map(([model, v]) => ({ model, ...v }));

    return { configured: true, totalTokensIn, totalTokensOut, totalCostUsd, daily, byModel };
  } catch (err) {
    return { configured: false, reason: (err as Error).message };
  }
}
