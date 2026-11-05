interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  tint: string;
  tintSoft: string;
}

export function KpiCard({ label, value, sub, tint, tintSoft }: KpiCardProps) {
  return (
    <div className="flex min-w-[190px] flex-1 flex-col gap-3 rounded-2xl p-[18px]" style={{ background: tintSoft }}>
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-white">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: tint }} />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">{label}</span>
      <span className="text-[28px] font-bold leading-none text-slate-900">{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

interface DetailKpiCardProps {
  label: string;
  value: string;
  paren?: string;
  trendLabel?: string;
  barPct: number;
  tint: string;
  tintSoft: string;
}

export function DetailKpiCard({ label, value, paren, trendLabel, barPct, tint, tintSoft }: DetailKpiCardProps) {
  return (
    <div className="flex min-w-[260px] flex-1 flex-col gap-3 rounded-[14px] border border-border bg-white p-[18px]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px]" style={{ background: tintSoft }}>
            <span className="h-2 w-2 rounded-full" style={{ background: tint }} />
          </span>
          <span className="text-[13px] font-semibold text-slate-900">{label}</span>
        </div>
        {trendLabel && (
          <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-bold text-green">{trendLabel}</span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[26px] font-bold leading-none text-slate-900">{value}</span>
        {paren && <span className="text-xs text-slate-500">{paren}</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEF1F6]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(barPct, 100)}%`, background: tint }} />
      </div>
    </div>
  );
}
