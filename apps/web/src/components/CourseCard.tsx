import { motion } from "framer-motion";
import type { DashboardCourse } from "@parishodh/shared";
import ProgressBar from "./ProgressBar";
import { cardVariants } from "../lib/motion";

export default function CourseCard({ course }: { course: DashboardCourse }) {
  const percent =
    course.moduleCount === 0 ? 0 : Math.round((course.completedModules / course.moduleCount) * 100);
  const completed = course.completedModules === course.moduleCount;

  return (
    <motion.div
      variants={cardVariants}
      className="rounded-2xl border border-border bg-white p-6 shadow-sm"
    >
      <h3 className="text-base font-semibold text-slate-900">{course.title}</h3>
      <p className="mb-4 text-sm text-slate-500">{course.subtitle}</p>
      <ProgressBar percent={percent} />
      <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
        <span>
          {course.completedModules} / {course.moduleCount} modules
        </span>
        <span className="font-semibold text-slate-900">{percent}%</span>
      </div>
      {completed && (
        <span className="mt-4 inline-block rounded-full bg-green-soft px-3 py-1 text-xs font-semibold text-green">
          &#10003; Basic Package Completed
        </span>
      )}
    </motion.div>
  );
}
