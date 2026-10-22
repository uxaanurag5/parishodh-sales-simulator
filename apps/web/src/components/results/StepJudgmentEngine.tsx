import { useState } from "react";
import { motion } from "framer-motion";
import type { CriterionDisplay } from "@parishodh/shared";

export default function StepJudgmentEngine({ criteria }: { criteria: CriterionDisplay[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = criteria.find((c) => c.criterionKey === openKey) ?? null;

  return (
    <div className="mx-auto max-w-5xl pt-4">
      <h1 className="mb-8 text-center text-2xl font-semibold">
        Parishodh Judgment Engine &middot; <span className="text-teal-glow">Behind the Scenes</span>
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {criteria.map((c, i) => (
          <motion.button
            key={c.criterionKey}
            onClick={() => setOpenKey(c.criterionKey)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="relative rounded-2xl border p-5 text-left transition hover:border-teal-glow/60"
            style={{ background: "rgba(27,182,201,0.08)", borderColor: "rgba(27,182,201,0.3)" }}
          >
            <span className="absolute right-4 top-4">
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={c.met ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.4 + i * 0.3 }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-green text-[11px] text-white"
              >
                &#10003;
              </motion.span>
            </span>
            <h3 className="mb-2 pr-8 text-sm font-semibold text-white">{c.title}</h3>
            <p className="text-xs text-white/60">{c.question}</p>
          </motion.button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 px-6"
          onClick={() => setOpenKey(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
          >
            <h3 className="mb-1 text-sm font-semibold">{open.title}</h3>
            <p className="mb-3 text-xs text-slate-500">{open.question}</p>
            <p className="text-sm italic text-slate-700">
              {open.evidence ? `“${open.evidence}”` : "No evidence recorded for this criterion."}
            </p>
            <button onClick={() => setOpenKey(null)} className="mt-4 text-xs font-semibold text-primary">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
