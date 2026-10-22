import { useState } from "react";
import { motion } from "framer-motion";
import type { SessionReport } from "@parishodh/shared";
import { useCountUp } from "../../hooks/useCountUp";

export default function StepOutput({ report }: { report: SessionReport }) {
  const score = useCountUp(report.report.overallScore, 1000);

  return (
    <div className="mx-auto max-w-5xl rounded-[24px] bg-white p-8 text-slate-900 shadow-2xl">
      <h2 className="mb-6 text-lg">
        <span className="font-bold">{report.learnerName}</span>
        <span className="text-slate-500"> &mdash; Live Sales Simulation</span>
      </h2>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <ul className="divide-y divide-border">
            <SummaryRow
              label="Course Completion"
              value={report.course.completed ? "✓ Completed" : "In progress"}
              tone="green"
            />
            <SummaryRow label="Final Assessment" value={`${report.assessment.score}%`} tone="blue" />
            <SummaryRow label="Live Simulation" value="✓ Completed" tone="green" />
          </ul>
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-navy-900 to-teal p-6 text-white">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
              Live Capability Score
            </div>
            <div className="mt-2 text-5xl font-bold">{score}%</div>
            <div className="mt-1 text-sm font-medium text-white/90">{report.report.verdict}</div>
          </div>
        </div>

        <div>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Live Capability Assessment
          </div>
          <div className="space-y-3">
            {report.report.dimensions.map((dim, i) => (
              <DimensionBar key={dim.key} label={dim.label} score={dim.score} delay={i * 0.1} />
            ))}
          </div>
          <StrengthsImprovements strengths={report.report.strengths} improvements={report.report.improvements} />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, tone }: { label: string; value: string; tone: "green" | "blue" }) {
  return (
    <li className="flex items-center justify-between py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${tone === "green" ? "text-green" : "text-primary"}`}>{value}</span>
    </li>
  );
}

function DimensionBar({ label, score, delay }: { label: string; score: number; delay: number }) {
  const value = useCountUp(score, 900);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-navy-900 to-teal"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StrengthsImprovements({
  strengths,
  improvements,
}: {
  strengths: string[];
  improvements: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6">
      <button onClick={() => setOpen((o) => !o)} className="text-xs font-semibold text-primary">
        {open ? "Hide" : "Show"} strengths / areas to improve
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-green">
              Strengths
            </div>
            <ul className="space-y-1 text-xs text-slate-600">
              {strengths.map((s) => (
                <li key={s}>&bull; {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-amber">
              Areas to improve
            </div>
            <ul className="space-y-1 text-xs text-slate-600">
              {improvements.map((s) => (
                <li key={s}>&bull; {s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
