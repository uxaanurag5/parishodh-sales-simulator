import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { TrainerReportRow, TrainerStats } from "@parishodh/shared";
import { api } from "../../lib/api";

function downloadCsv(rows: TrainerReportRow[]) {
  const header = ["Learner", "Scenario", "Ended At", "Duration (s)", "Score", "Verdict"];
  const lines = [
    header,
    ...rows.map((r) => [
      r.learnerName,
      r.scenarioTitle,
      r.endedAt ?? "",
      String(r.durationSeconds ?? ""),
      String(r.overallScore),
      r.verdict,
    ]),
  ];
  const csv = lines.map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "parishodh-reports.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsTab() {
  const navigate = useNavigate();
  const reportsQuery = useQuery({
    queryKey: ["trainer-reports"],
    queryFn: () => api.get<TrainerReportRow[]>("/api/trainer/reports"),
  });
  const statsQuery = useQuery({
    queryKey: ["trainer-reports-stats"],
    queryFn: () => api.get<TrainerStats>("/api/trainer/reports/stats"),
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Sessions</h2>
          <button
            onClick={() => reportsQuery.data && downloadCsv(reportsQuery.data)}
            disabled={!reportsQuery.data?.length}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.1em] text-slate-400">
              <th className="pb-2">Learner</th>
              <th className="pb-2">Scenario</th>
              <th className="pb-2">Date</th>
              <th className="pb-2">Duration</th>
              <th className="pb-2">Score</th>
              <th className="pb-2">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reportsQuery.data?.map((r) => (
              <tr
                key={r.sessionId}
                className="cursor-pointer hover:bg-panel"
                onClick={() => navigate(`/simulation/${r.sessionId}/results`)}
              >
                <td className="py-2 font-medium text-slate-900">{r.learnerName}</td>
                <td className="py-2 text-slate-600">{r.scenarioTitle}</td>
                <td className="py-2 text-slate-500">
                  {r.endedAt ? new Date(r.endedAt).toLocaleDateString() : "—"}
                </td>
                <td className="py-2 text-slate-500">
                  {r.durationSeconds ? `${Math.round(r.durationSeconds / 60)} min` : "—"}
                </td>
                <td className="py-2 font-semibold text-primary">{r.overallScore}%</td>
                <td className="py-2 text-slate-600">{r.verdict}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {reportsQuery.data?.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No completed sessions yet.</p>
        )}
      </section>

      {statsQuery.data && statsQuery.data.dimensionAverages.length > 0 && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Average score by dimension</h2>
            <div className="space-y-3">
              {statsQuery.data.dimensionAverages.map((d) => (
                <div key={d.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{d.label}</span>
                    <span className="font-semibold text-slate-900">{d.average}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-navy-900 to-teal"
                      style={{ width: `${d.average}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Learning score vs live score</h2>
            <ScatterChart points={statsQuery.data.scatter} />
          </div>
        </section>
      )}
    </div>
  );
}

function ScatterChart({ points }: { points: TrainerStats["scatter"] }) {
  const size = 240;
  const padding = 24;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height={size}>
      <line x1={padding} y1={size - padding} x2={size - padding} y2={size - padding} stroke="#E2E8F0" />
      <line x1={padding} y1={padding} x2={padding} y2={size - padding} stroke="#E2E8F0" />
      <line
        x1={padding}
        y1={size - padding}
        x2={size - padding}
        y2={padding}
        stroke="#E2E8F0"
        strokeDasharray="4 4"
      />
      {points.map((p, i) => {
        const x = padding + (p.learningScore / 100) * (size - padding * 2);
        const y = size - padding - (p.liveScore / 100) * (size - padding * 2);
        return <circle key={i} cx={x} cy={y} r={5} fill="#1BB6C9" fillOpacity={0.8} />;
      })}
      <text x={padding} y={size - 6} fontSize="9" fill="#64748B">
        Learning score &rarr;
      </text>
      <text x={4} y={padding - 8} fontSize="9" fill="#64748B">
        Live &uarr;
      </text>
    </svg>
  );
}
