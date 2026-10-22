import { motion } from "framer-motion";
import type { SessionReport } from "@parishodh/shared";

export default function StepLearningToCapability({ report }: { report: SessionReport }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 pt-12 sm:flex-row sm:justify-center">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xs rounded-2xl bg-white p-6 text-center text-slate-900 shadow-xl"
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
          Learning Score
        </div>
        <div className="mt-2 text-5xl font-bold text-primary">{report.learningScore}%</div>
        <div className="mt-1 text-xs text-slate-500">Course + Final Assessment</div>
        <span className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-primary">
          &#10003; Knows the material
        </span>
      </motion.div>

      <motion.svg
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        width="64"
        height="24"
        viewBox="0 0 64 24"
        className="hidden shrink-0 rotate-90 sm:block sm:rotate-0"
      >
        <motion.path
          d="M2 12h54M48 4l12 8-12 8"
          stroke="#22D3EE"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        />
      </motion.svg>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="w-full max-w-xs rounded-2xl bg-white p-6 text-center text-slate-900 shadow-xl"
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-green">
          Live Performance Score
        </div>
        <div className="mt-2 text-5xl font-bold text-green">{report.report.overallScore}%</div>
        <div className="mt-1 text-xs text-slate-500">{report.scenarioTitle} simulation</div>
        <span className="mt-3 inline-block rounded-full bg-green-soft px-3 py-1 text-[11px] font-semibold text-green">
          &#10003; Can do the job
        </span>
      </motion.div>
    </div>
  );
}
