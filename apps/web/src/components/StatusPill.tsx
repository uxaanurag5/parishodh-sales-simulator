export type DashboardStatus = "in-progress" | "course-completed" | "live-task-assigned";

const CONFIG: Record<DashboardStatus, { label: string; className: string }> = {
  "in-progress": { label: "In Progress", className: "bg-blue-50 text-primary" },
  "course-completed": { label: "✓ Course Completed", className: "bg-green-soft text-green" },
  "live-task-assigned": { label: "● Live Task Assigned", className: "bg-amber-50 text-amber" },
};

export default function StatusPill({ status }: { status: DashboardStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>
  );
}
