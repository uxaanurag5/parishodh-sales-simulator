import type { CustomerSummary } from "../../store/callStore";
import Waveform from "./Waveform";

export default function CustomerCard({
  customer,
  speaking,
  level,
}: {
  customer: CustomerSummary | null;
  speaking: boolean;
  level?: number;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
            {customer?.initials ?? "?"}
          </div>
          <div>
            <div className="text-base font-semibold">{customer?.name ?? "Simulated customer"}</div>
            <div className="text-xs text-white/60">Simulated customer &middot; Trainer Emulation Layer</div>
          </div>
        </div>
        <span
          className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] ${
            speaking ? "text-teal-glow" : "text-white/50"
          }`}
        >
          {speaking ? "● Speaking" : "Listening"}
        </span>
      </div>
      <div className="mt-5">
        <Waveform active={speaking} level={level} />
      </div>
    </div>
  );
}
