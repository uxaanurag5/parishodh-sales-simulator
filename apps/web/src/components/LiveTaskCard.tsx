import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { DashboardLiveTask, User, CreateSessionResponse } from "@parishodh/shared";
import { api } from "../lib/api";
import { cardVariants } from "../lib/motion";

interface LiveTaskCardProps {
  liveTask: DashboardLiveTask;
  learner: User;
}

export default function LiveTaskCard({ liveTask, learner }: LiveTaskCardProps) {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => api.post<CreateSessionResponse>(`/api/live-tasks/${liveTask.id}/sessions`),
    onSuccess: (data) => navigate(`/simulation/${data.sessionId}`),
  });

  const isCompleted = liveTask.status === "COMPLETED" && liveTask.completedSessionId;

  return (
    <motion.div
      variants={cardVariants}
      className={`rounded-2xl border bg-white p-6 shadow-sm ${
        isCompleted ? "border-green/40" : "border-amber shadow-[0_0_24px_rgba(245,158,11,0.18)]"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-3 py-1 text-xs font-semibold text-green">
            &#10003; Completed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber">
            &#9679; LIVE
          </span>
        )}
        {isCompleted ? (
          <div className="flex items-center gap-3">
            {liveTask.capabilityScore !== null && (
              <span className="text-sm font-semibold text-green">
                {liveTask.capabilityScore}% {liveTask.verdict}
              </span>
            )}
            <button
              onClick={() => navigate(`/simulation/${liveTask.completedSessionId}/results`)}
              className="rounded-lg bg-navy-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy-800"
            >
              View report
            </button>
          </div>
        ) : (
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-lg bg-navy-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60"
          >
            {mutation.isPending ? "Starting…" : "Start Simulation"}
          </button>
        )}
      </div>
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Parishodh | Live Sales Simulation
      </h3>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <Detail label="Trainee" value={learner.name} />
        <Detail label="Scenario" value={liveTask.scenario.title} />
        <Detail label="Customer Intent" value={liveTask.scenario.intent} />
        <Detail label="Preferred Colour" value={liveTask.scenario.preferredColour} />
      </div>
      <div className="mt-4">
        <Detail label="Objective" value={liveTask.scenario.objective} />
      </div>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
