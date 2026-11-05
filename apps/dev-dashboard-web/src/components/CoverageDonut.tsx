import type { CoverageSummary } from "../api/client";

export function CoverageDonut({ coverage }: { coverage: CoverageSummary }) {
  if (!coverage.available || coverage.linesPct === undefined) {
    return (
      <div className="flex flex-col gap-2 text-sm text-slate-500">
        <span className="font-semibold text-slate-700">Not available yet</span>
        <p className="m-0 text-xs leading-relaxed">{coverage.reason}</p>
      </div>
    );
  }

  const pct = coverage.linesPct;
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const filled = (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-[18px]">
      <svg width={120} height={120} viewBox="0 0 120 120" role="img" aria-label={`Line coverage: ${pct.toFixed(1)}%`}>
        <circle cx={60} cy={60} r={r} fill="none" stroke="#F1F5F9" strokeWidth={14} />
        <circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke="#16A34A"
          strokeWidth={14}
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform="rotate(-90 60 60)"
          strokeLinecap="round"
        />
        <text x={60} y={57} fontSize={20} fontWeight={700} fill="#0F172A" textAnchor="middle">
          {pct.toFixed(0)}%
        </text>
        <text x={60} y={73} fontSize={10} fill="#64748B" textAnchor="middle">
          Coverage
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {coverage.sources?.map((s) => (
          <span key={s.app} className="flex items-center gap-1.5 text-xs text-slate-700">
            <span className="h-2 w-2 rounded-full bg-green" />
            {s.app} <strong className="ml-auto text-slate-900">{s.pct.toFixed(1)}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
