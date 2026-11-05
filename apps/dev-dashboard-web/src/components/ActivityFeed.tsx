import type { GithubSummary } from "../api/client";

const TINTS: Record<string, { tint: string; soft: string }> = {
  pr_merged: { tint: "#16A34A", soft: "#DCFCE7" },
  pr_opened: { tint: "#1450A3", soft: "#E8F0FD" },
  review: { tint: "#7C3AED", soft: "#F1EAFE" },
};

const LABELS: Record<string, string> = {
  pr_merged: "PR merged",
  pr_opened: "PR opened",
  review: "Review given",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function ActivityFeed({ github }: { github: GithubSummary }) {
  if (!github.configured) {
    return (
      <div className="flex flex-col gap-1.5 py-2">
        <span className="text-sm font-semibold text-slate-700">GitHub not connected</span>
        <p className="m-0 text-xs text-slate-500">{github.reason}</p>
      </div>
    );
  }

  const items = github.recentActivity ?? [];
  if (items.length === 0) {
    return <p className="py-2 text-sm text-slate-400">No PR or review activity in this range yet.</p>;
  }

  return (
    <>
      {items.map((item, i) => {
        const tint = TINTS[item.type] ?? { tint: "#94A3B8", soft: "#F1F5F9" };
        return (
          <a
            key={`${item.url}-${i}`}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 border-b border-[#F1F5F9] py-2.5 no-underline hover:bg-[#F8FAFC]"
          >
            <span
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: tint.soft }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: tint.tint }} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] font-semibold text-slate-900">{LABELS[item.type]}</span>
              <span className="truncate text-xs text-slate-500">{item.title}</span>
            </span>
            <span className="whitespace-nowrap text-[11px] text-slate-400">{timeAgo(item.date)}</span>
          </a>
        );
      })}
    </>
  );
}
