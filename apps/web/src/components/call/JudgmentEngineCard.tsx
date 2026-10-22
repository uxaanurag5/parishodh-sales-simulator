import { motion } from "framer-motion";
import type { Capture } from "@parishodh/shared";

interface JudgmentEngineCardProps {
  captures: Capture[];
  evaluating: boolean;
}

export default function JudgmentEngineCard({ captures, evaluating }: JudgmentEngineCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        <span className="relative flex h-2 w-2">
          {evaluating && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${evaluating ? "bg-teal" : "bg-slate-300"}`} />
        </span>
        Judgment Engine &middot; Live Capture
      </div>
      {captures.length === 0 ? (
        <p className="text-sm text-slate-400">Captures will appear here as they&apos;re detected.</p>
      ) : (
        <div role="status" aria-live="polite" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {captures.map((capture) => (
            <motion.div
              key={capture.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs"
            >
              <span className="flex items-center gap-1.5 font-medium text-slate-900">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green text-[10px] text-white">
                  &#10003;
                </span>
                {capture.label}
              </span>
              <span className="text-slate-500">{capture.value}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
