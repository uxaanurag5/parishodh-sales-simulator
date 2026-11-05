import type { GithubSummary, ClaudeUsageSummary, IntegrationStatus } from "../api/client";

interface Row {
  name: string;
  sub: string;
  connected: boolean;
  onConfigure?: () => void;
  href?: string;
}

interface IntegrationsPanelProps {
  github: GithubSummary;
  claude: ClaudeUsageSummary;
  jira: IntegrationStatus | undefined;
  confluence: IntegrationStatus | undefined;
  onOpenSettings: () => void;
}

export function IntegrationsPanel({ github, claude, jira, confluence, onOpenSettings }: IntegrationsPanelProps) {
  const rows: Row[] = [
    {
      name: "Git / GitHub",
      sub: github.configured ? `${github.owner}/${github.repo} · @${github.login}` : "Not connected",
      connected: github.configured,
      href: github.configured ? `https://github.com/${github.owner}/${github.repo}` : undefined,
    },
    {
      name: "Claude (Anthropic)",
      sub: claude.configured ? "Usage & Cost Reporting API" : "Not connected",
      connected: claude.configured,
    },
    {
      name: "Jira",
      sub: jira?.configured ? jira.baseUrl ?? "Connected" : "Not configured",
      connected: !!jira?.configured,
      onConfigure: onOpenSettings,
    },
    {
      name: "Confluence",
      sub: confluence?.configured ? confluence.baseUrl ?? "Connected" : "Not configured",
      connected: !!confluence?.configured,
      onConfigure: onOpenSettings,
    },
  ];

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-[15px] font-bold text-slate-900">Integrations</h2>
      </div>

      {rows.map((row) => (
        <div key={row.name} className="flex items-center gap-2.5 border-b border-[#F1F5F9] py-2.5">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[13px] font-semibold text-slate-900">{row.name}</span>
            <span className="truncate text-[11px] text-slate-400">{row.sub}</span>
          </span>
          <span
            className="flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: row.connected ? "#16A34A" : "#94A3B8" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: row.connected ? "#16A34A" : "#CBD5E1" }} />
            {row.connected ? "Connected" : "Not connected"}
          </span>
          {row.href && (
            <a
              href={row.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-[7px] border border-[#CBD9EF] bg-white px-2.5 py-1 text-[11px] font-semibold text-primary no-underline"
            >
              Open
            </a>
          )}
          {row.onConfigure && (
            <button
              type="button"
              onClick={row.onConfigure}
              className="rounded-[7px] border border-[#CBD9EF] bg-white px-2.5 py-1 text-[11px] font-semibold text-primary"
            >
              Configure
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
