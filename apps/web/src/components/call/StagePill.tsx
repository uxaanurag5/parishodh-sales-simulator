import { AnimatePresence, motion } from "framer-motion";

export default function StagePill({ label }: { label: string | null }) {
  if (!label) return null;

  return (
    <div className="overflow-hidden rounded-full bg-blue-50 px-3 py-1">
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-primary"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
