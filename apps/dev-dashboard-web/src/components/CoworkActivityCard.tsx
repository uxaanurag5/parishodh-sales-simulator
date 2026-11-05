import type { CoworkActivity } from "../api/client";

export function CoworkActivityCard({ cowork }: { cowork: CoworkActivity | undefined }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-[15px] font-bold text-slate-900">Cowork Activity (Claude documents)</h2>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: "#F1F5F9", color: "#64748B" }}
        >
          Coming soon
        </span>
      </div>
      <p className="m-0 text-xs leading-relaxed text-slate-500">
        {cowork?.note ??
          "Claude.ai documents and session activity aren't exposed through a public API yet, so this panel can't show live data. It's left as a clearly-labeled placeholder rather than filled with guessed numbers."}
      </p>
    </div>
  );
}
