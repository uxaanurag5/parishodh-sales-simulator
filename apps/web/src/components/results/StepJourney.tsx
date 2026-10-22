import { motion } from "framer-motion";
import type { SessionReport } from "@parishodh/shared";

export default function StepJourney({ report }: { report: SessionReport }) {
  const firstName = report.learnerName.split(" ")[0] ?? report.learnerName;
  const nodes = [
    { icon: "📖", title: "Basic Package", subtitle: "Completed" },
    { icon: "📋", title: "Final Assessment", subtitle: `${report.assessment.score}%` },
    { icon: "🚗", title: "Live Simulation", subtitle: `${report.scenarioTitle} call` },
  ];

  return (
    <div className="mx-auto max-w-3xl pt-10 text-center">
      <h1 className="mb-12 text-2xl font-semibold">{firstName}&apos;s Parishodh Journey</h1>
      <div className="relative flex items-start justify-between">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ originX: 0 }}
          className="absolute left-0 right-0 top-6 h-[2px] bg-teal-glow/60"
        />
        {nodes.map((node, i) => (
          <motion.div
            key={node.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.3 }}
            className="relative z-10 flex flex-1 flex-col items-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-lg">
              {node.icon}
            </span>
            <span className="mt-3 text-sm font-semibold text-white">{node.title}</span>
            <span className="text-xs text-white/60">{node.subtitle}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
