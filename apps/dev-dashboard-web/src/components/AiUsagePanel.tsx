import type { ClaudeUsageSummary } from "../api/client";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function AiUsagePanel({ usage }: { usage: ClaudeUsageSummary }) {
  if (!usage.configured) {
    return (
      <div className="flex flex-col gap-2">
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ background: "#FEF3E2", color: "#F59E0B" }}
        >
          Not connected
        </span>
        <p className="m-0 text-sm text-slate-500">{usage.reason}</p>
        <p className="m-0 text-xs text-slate-400">
          Add <code>ANTHROPIC_ADMIN_API_KEY</code> to <code>apps/dev-dashboard-api/.env</code> (an Admin API key from
          console.anthropic.com with the Usage &amp; Cost Reporting scope) and restart the API.
        </p>
      </div>
    );
  }

  const rows = (usage.byModel ?? []).slice().sort((a, b) => b.costUsd - a.costUsd);
  const maxCost = Math.max(1, ...rows.map((r) => r.costUsd));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-6 text-sm text-slate-600">
        <span>
          Tokens in/out: <strong className="text-slate-900">{formatTokens(usage.totalTokensIn ?? 0)}</strong> /{" "}
          <strong className="text-slate-900">{formatTokens(usage.totalTokensOut ?? 0)}</strong>
        </span>
        <span>
          Total cost: <strong className="text-slate-900">${(usage.totalCostUsd ?? 0).toFixed(2)}</strong>
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[420px] flex-col">
          <div className="flex gap-2.5 border-b border-border pb-2">
            <span className="flex-[2.4] text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Model
            </span>
            <span className="flex-1 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Tokens In/Out
            </span>
            <span className="flex-[0.9] text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Cost
            </span>
            <span className="flex-1 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Share
            </span>
          </div>
          {rows.length === 0 && <p className="py-3 text-sm text-slate-400">No usage recorded in this range.</p>}
          {rows.map((r) => (
            <div key={r.model} className="flex items-center gap-2.5 border-b border-[#F1F5F9] py-2.5">
              <span className="flex-[2.4] font-mono text-[13px] font-semibold text-slate-900">{r.model}</span>
              <span className="flex-1 text-right font-mono text-xs text-slate-700">
                {formatTokens(r.tokensIn)} / {formatTokens(r.tokensOut)}
              </span>
              <span className="flex-[0.9] text-right font-mono text-[13px] font-bold text-slate-900">
                ${r.costUsd.toFixed(2)}
              </span>
              <span className="flex flex-1 justify-end">
                <span className="block h-[5px] w-[70px] overflow-hidden rounded-full bg-[#EEF1F6]">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(r.costUsd / maxCost) * 100}%` }}
                  />
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="m-0 text-[11px] text-slate-400">
        Grouped by model via Anthropic's Usage &amp; Cost Reporting API. Per-task request counts aren't exposed by
        that API, so they're omitted rather than estimated.
      </p>
    </div>
  );
}
