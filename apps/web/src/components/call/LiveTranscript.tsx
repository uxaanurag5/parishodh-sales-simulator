import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { DisplayItem } from "../../store/callStore";

interface LiveTranscriptProps {
  items: DisplayItem[];
  streamingText: string;
  customerSpeaking: boolean;
  learnerName: string;
  customerName: string;
}

export default function LiveTranscript({
  items,
  streamingText,
  customerSpeaking,
  learnerName,
  customerName,
}: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, streamingText]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Live Transcript
      </div>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Live call transcript"
        className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
      >
        {items.map((item) =>
          item.kind === "divider" ? (
            <div key={item.key} className="py-2 text-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {item.label}
              </span>
            </div>
          ) : (
            <Bubble
              key={item.key}
              speaker={item.speaker}
              text={item.text}
              learnerName={learnerName}
              customerName={customerName}
            />
          ),
        )}
        {customerSpeaking && (
          // Growing char-by-char while streaming — hidden from the live region so
          // screen readers announce the finished turn once, not every delta.
          <div aria-hidden="true">
            <Bubble
              speaker="CUSTOMER"
              text={`${streamingText}…`}
              learnerName={learnerName}
              customerName={customerName}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({
  speaker,
  text,
  learnerName,
  customerName,
}: {
  speaker: "LEARNER" | "CUSTOMER";
  text: string;
  learnerName: string;
  customerName: string;
}) {
  const isLearner = speaker === "LEARNER";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col ${isLearner ? "items-end" : "items-start"}`}
    >
      <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {isLearner ? learnerName : customerName}
      </span>
      <span
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed text-slate-900 ${
          isLearner ? "bg-[#E8F1FD]" : "bg-slate-100"
        }`}
      >
        {text}
      </span>
    </motion.div>
  );
}
