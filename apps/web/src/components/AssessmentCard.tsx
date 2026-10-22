import { motion } from "framer-motion";
import type { DashboardAssessment } from "@parishodh/shared";
import { useCountUp } from "../hooks/useCountUp";
import { cardVariants } from "../lib/motion";

export default function AssessmentCard({ assessment }: { assessment: DashboardAssessment }) {
  const score = useCountUp(assessment.score);

  return (
    <motion.div
      variants={cardVariants}
      className="rounded-2xl border border-border bg-white p-6 shadow-sm"
    >
      <h3 className="text-base font-semibold text-slate-900">{assessment.title}</h3>
      <p className="mb-4 text-sm text-slate-500">{assessment.questionCount} questions</p>
      <div className="flex items-baseline gap-2">
        <span className="text-6xl font-bold text-brand">{score}%</span>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          score
        </span>
      </div>
      {assessment.passed && (
        <span className="mt-4 inline-block rounded-full bg-green-soft px-3 py-1 text-xs font-semibold text-green">
          &#10003; {assessment.title}: {assessment.score}% Passed
        </span>
      )}
    </motion.div>
  );
}
