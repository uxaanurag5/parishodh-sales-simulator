import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import type { LearnerDashboard } from "@parishodh/shared";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import StatusPill, { type DashboardStatus } from "../components/StatusPill";
import CourseCard from "../components/CourseCard";
import AssessmentCard from "../components/AssessmentCard";
import LiveTaskCard from "../components/LiveTaskCard";
import { staggerContainer } from "../lib/motion";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["learner-dashboard"],
    queryFn: () => api.get<LearnerDashboard>("/api/learner/dashboard"),
    enabled: user?.role === "LEARNER",
  });

  if (!user) return null;
  if (user.role !== "LEARNER") return <Navigate to="/trainer" replace />;

  const status: DashboardStatus = data?.liveTask
    ? "live-task-assigned"
    : data?.course?.status === "COMPLETED"
      ? "course-completed"
      : "in-progress";

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.avatarInitials}
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">{user.name}</div>
            <div className="text-sm text-slate-500">{user.team}</div>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading your dashboard…</p>}
      {isError && <p className="text-sm text-red-600">Could not load your dashboard.</p>}

      {data && (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {data.course && <CourseCard course={data.course} />}
            {data.assessment && <AssessmentCard assessment={data.assessment} />}
          </div>
          {data.liveTask && <LiveTaskCard liveTask={data.liveTask} learner={user} />}
        </motion.div>
      )}
    </div>
  );
}
