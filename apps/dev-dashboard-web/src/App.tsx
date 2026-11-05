import { useState, type ReactNode } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { KpiCard, DetailKpiCard } from "./components/KpiCard";
import { CommitsChart } from "./components/CommitsChart";
import { CoverageDonut } from "./components/CoverageDonut";
import { AiUsagePanel } from "./components/AiUsagePanel";
import { ActivityFeed } from "./components/ActivityFeed";
import { IntegrationsPanel } from "./components/IntegrationsPanel";
import { CoworkActivityCard } from "./components/CoworkActivityCard";
import { CredentialForm } from "./components/CredentialForm";
import {
  useGitSummary,
  useGithubSummary,
  useClaudeUsage,
  useCoverage,
  useIntegrationsStatus,
  useCoworkActivity,
  useSaveCredential,
  useClearCredential,
  type Credential,
} from "./api/client";

function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-3.5 rounded-2xl border border-border bg-white p-[22px] ${className}`}>
      {title && <h2 className="m-0 text-[15px] font-bold text-slate-900">{title}</h2>}
      {children}
    </div>
  );
}

function DashboardPage({ days, onOpenSettings }: { days: number; onOpenSettings: () => void }) {
  const git = useGitSummary(days);
  const github = useGithubSummary(days);
  const claude = useClaudeUsage(Math.min(days, 31));
  const coverage = useCoverage();
  const integrations = useIntegrationsStatus();
  const cowork = useCoworkActivity();

  if (git.isLoading) return <div className="p-8 text-sm text-slate-400">Loading live data…</div>;
  if (git.isError || !git.data) {
    return <div className="p-8 text-sm text-red-600">Could not reach the dashboard API. Is it running on :4100?</div>;
  }

  const g = git.data;
  const gh = github.data ?? { configured: false, reason: "Loading…" };
  const cl = claude.data ?? { configured: false, reason: "Loading…" };

  return (
    <div className="flex flex-wrap gap-6 p-8">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
        <div className="flex flex-wrap gap-4">
          <KpiCard
            label="Commits (range)"
            value={String(g.commitsInRange)}
            sub={`${g.totalCommits} total in repo`}
            tint="#16A34A"
            tintSoft="#DCFCE7"
          />
          <KpiCard
            label="PRs Authored"
            value={gh.configured ? String(gh.prsAuthored ?? 0) : "—"}
            sub={gh.configured ? `${gh.mergedPRs ?? 0} merged` : "GitHub not connected"}
            tint="#1450A3"
            tintSoft="#E8F0FD"
          />
          <KpiCard
            label="Reviews Given"
            value={gh.configured ? String(gh.reviewsGiven ?? 0) : "—"}
            sub="on this repo"
            tint="#7C3AED"
            tintSoft="#F1EAFE"
          />
          <KpiCard
            label="Line Coverage"
            value={coverage.data?.available ? `${coverage.data.linesPct?.toFixed(0)}%` : "—"}
            sub={coverage.data?.available ? "from latest test run" : "no coverage report yet"}
            tint="#1BB6C9"
            tintSoft="#E1FAF7"
          />
          <KpiCard
            label="AI Cost (range)"
            value={cl.configured ? `$${(cl.totalCostUsd ?? 0).toFixed(2)}` : "—"}
            sub={cl.configured ? "Claude usage" : "not connected"}
            tint="#F59E0B"
            tintSoft="#FEF3E2"
          />
        </div>

        <div className="flex flex-wrap gap-5">
          <Panel title="Commits per day" className="min-w-[320px] flex-[2_1_420px]">
            <CommitsChart dailyCommits={g.dailyCommits} />
          </Panel>
          <Panel title="Test Coverage" className="min-w-[240px] flex-[1_1_260px]">
            {coverage.data && <CoverageDonut coverage={coverage.data} />}
          </Panel>
        </div>

        <div className="flex flex-col gap-3.5">
          <h2 className="m-0 text-[17px] font-bold text-slate-900">Detailed KPIs</h2>
          <div className="flex flex-wrap gap-4">
            <DetailKpiCard
              label="Lines Changed"
              value={`+${g.linesAdded} / -${g.linesDeleted}`}
              paren={`${g.recentCommits.length} recent commits`}
              barPct={Math.min(100, (g.linesAdded / Math.max(g.linesAdded + g.linesDeleted, 1)) * 100)}
              tint="#16A34A"
              tintSoft="#DCFCE7"
            />
            <DetailKpiCard
              label="Open PRs"
              value={gh.configured ? String(gh.openPRs ?? 0) : "—"}
              paren={gh.configured ? `${gh.owner}/${gh.repo}` : "not connected"}
              barPct={gh.configured ? Math.min(100, (gh.openPRs ?? 0) * 10) : 0}
              tint="#1450A3"
              tintSoft="#E8F0FD"
            />
            <DetailKpiCard
              label="Coverage"
              value={coverage.data?.available ? `${coverage.data.linesPct?.toFixed(1)}%` : "No data"}
              paren={coverage.data?.sources?.map((s) => s.app).join(", ")}
              barPct={coverage.data?.linesPct ?? 0}
              tint="#1BB6C9"
              tintSoft="#E1FAF7"
            />
            <DetailKpiCard
              label="AI Tokens In/Out"
              value={cl.configured ? `${((cl.totalTokensIn ?? 0) / 1000).toFixed(1)}K / ${((cl.totalTokensOut ?? 0) / 1000).toFixed(1)}K` : "Not connected"}
              paren="Claude usage API"
              barPct={cl.configured ? 60 : 0}
              tint="#F59E0B"
              tintSoft="#FEF3E2"
            />
          </div>
        </div>

        <Panel title="AI Usage & Cost by Model">
          <AiUsagePanel usage={cl} />
        </Panel>

        <CoworkActivityCard cowork={cowork.data} />
      </div>

      <div className="flex min-w-[260px] max-w-[320px] flex-[1_1_280px] flex-col gap-5">
        <IntegrationsPanel
          github={gh}
          claude={cl}
          jira={integrations.data?.jira}
          confluence={integrations.data?.confluence}
          onOpenSettings={onOpenSettings}
        />

        <Panel title="Recent Activity">
          <ActivityFeed github={gh} />
        </Panel>

        <Panel title="Quick Links">
          <div className="flex flex-col gap-1">
            {gh.configured && (
              <a href={`https://github.com/${gh.owner}/${gh.repo}`} target="_blank" rel="noreferrer" className="py-1.5 text-[13px] font-medium text-slate-900">
                → GitHub Repository
              </a>
            )}
            {integrations.data?.jira.configured && (
              <a href={integrations.data.jira.baseUrl} target="_blank" rel="noreferrer" className="py-1.5 text-[13px] font-medium text-slate-900">
                → Jira Board
              </a>
            )}
            {integrations.data?.confluence.configured && (
              <a href={integrations.data.confluence.baseUrl} target="_blank" rel="noreferrer" className="py-1.5 text-[13px] font-medium text-slate-900">
                → Confluence Space
              </a>
            )}
            <button type="button" onClick={onOpenSettings} className="py-1.5 text-left text-[13px] font-medium text-primary">
              → Configure Integrations
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SettingsPage() {
  const integrations = useIntegrationsStatus();
  const saveJira = useSaveCredential("jira");
  const saveConfluence = useSaveCredential("confluence");
  const clearJira = useClearCredential("jira");
  const clearConfluence = useClearCredential("confluence");

  return (
    <div className="flex flex-col gap-5 p-8">
      <div>
        <h1 className="m-0 text-2xl font-bold text-slate-900">Integrations & Settings</h1>
        <p className="m-0 text-[13px] text-slate-500">
          Jira and Confluence credentials live only in <code>apps/dev-dashboard-api/.data/integrations.json</code> on
          this machine. Claude's Admin API key and the GitHub token are server env vars — see{" "}
          <code>apps/dev-dashboard-api/.env.example</code>.
        </p>
      </div>
      <div className="flex flex-wrap gap-5">
        <div className="min-w-[320px] flex-1">
          <CredentialForm
            title="Jira"
            helpText="Connects to Jira Cloud's REST API v3 to show issues assigned to you."
            tokenHelpUrl="https://id.atlassian.com/manage-profile/security/api-tokens"
            status={integrations.data?.jira}
            saving={saveJira.isPending}
            lastResult={saveJira.data}
            onSave={(c: Credential) => saveJira.mutate(c)}
            onClear={() => clearJira.mutate()}
          />
        </div>
        <div className="min-w-[320px] flex-1">
          <CredentialForm
            title="Confluence"
            helpText="Connects to Confluence Cloud's REST API to show pages you've authored or edited."
            tokenHelpUrl="https://id.atlassian.com/manage-profile/security/api-tokens"
            status={integrations.data?.confluence}
            saving={saveConfluence.isPending}
            lastResult={saveConfluence.data}
            onSave={(c: Credential) => saveConfluence.mutate(c)}
            onClear={() => clearConfluence.mutate()}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<"dashboard" | "integrations">("dashboard");
  const [days, setDays] = useState(30);

  return (
    <div className="flex min-h-screen w-full items-stretch bg-panel">
      <Sidebar active={page} onSelect={(key) => setPage(key as "dashboard" | "integrations")} />
      <div className="flex min-w-0 flex-[999_1_760px] flex-col">
        {page === "dashboard" && (
          <Topbar developerName="Anurag Uxa" developerRole="Developer" days={days} onDaysChange={setDays} />
        )}
        {page === "dashboard" ? (
          <DashboardPage days={days} onOpenSettings={() => setPage("integrations")} />
        ) : (
          <SettingsPage />
        )}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border bg-white px-8 py-[18px]">
          <span className="text-xs text-slate-400">Parishodh | Developer Dashboard — live data, zero mock numbers</span>
          <a href="#" onClick={(e) => { e.preventDefault(); setPage(page === "dashboard" ? "integrations" : "dashboard"); }} className="text-xs text-slate-400">
            {page === "dashboard" ? "Integrations & Settings" : "← Back to Dashboard"}
          </a>
        </div>
      </div>
    </div>
  );
}
