import { motion } from "framer-motion";

const BAR_COUNT = 24;

interface WaveformProps {
  active: boolean;
  /** Optional 0-1 level from real TTS audio; when set, bars react to it instead of free-running. */
  level?: number;
}

export default function Waveform({ active, level }: WaveformProps) {
  if (!active) {
    return (
      <div className="flex h-8 items-center">
        <div className="h-px w-full border-t border-dashed border-white/25" />
      </div>
    );
  }

  if (typeof level === "number") {
    return (
      <div className="flex h-8 items-end gap-[3px]">
        {Array.from({ length: BAR_COUNT }).map((_, index) => {
          const jitter = 0.6 + Math.abs(Math.sin(index * 1.7)) * 0.4;
          const height = 4 + level * 26 * jitter;
          return (
            <motion.span
              key={index}
              className="w-[2px] rounded-full bg-teal-glow"
              animate={{ height }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex h-8 items-end gap-[3px]">
      {Array.from({ length: BAR_COUNT }).map((_, index) => {
        const base = 4 + Math.abs(Math.sin(index)) * 10;
        return (
          <motion.span
            key={index}
            className="w-[2px] rounded-full bg-teal-glow"
            initial={{ height: base }}
            animate={{ height: [base, base + 14, base + 4, base + 18, base] }}
            transition={{
              duration: 0.9 + (index % 5) * 0.08,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (index % 7) * 0.05,
            }}
          />
        );
      })}
    </div>
  );
}
