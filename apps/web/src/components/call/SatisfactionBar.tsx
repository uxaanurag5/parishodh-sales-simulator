import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface SatisfactionBarProps {
  value: number;
  delta?: number | null;
  reason?: string | null;
}

export default function SatisfactionBar({ value, delta, reason }: SatisfactionBarProps) {
  const [tooltip, setTooltip] = useState<{ delta: number; reason: string } | null>(null);
  const seenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!delta) return;
    const signature = `${value}:${delta}:${reason ?? ""}`;
    if (seenRef.current === signature) return;
    seenRef.current = signature;
    setTooltip({ delta, reason: reason ?? "" });
    const timer = setTimeout(() => setTooltip(null), 2500);
    return () => clearTimeout(timer);
  }, [value, delta, reason]);

  return (
    <div className="relative rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Simulated customer satisfaction
        </span>
        <span className="text-sm font-semibold text-slate-900">{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #EF4444, #F59E0B, #16A34A)" }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="absolute right-5 top-11 z-10 max-w-[220px] rounded-lg bg-navy-900 px-3 py-2 text-xs text-white shadow-lg"
          >
            <span className={`font-semibold ${tooltip.delta > 0 ? "text-green" : "text-amber"}`}>
              {tooltip.delta > 0 ? "+" : ""}
              {tooltip.delta}
            </span>
            {tooltip.reason && <span className="ml-1.5 text-white/80">{tooltip.reason}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
