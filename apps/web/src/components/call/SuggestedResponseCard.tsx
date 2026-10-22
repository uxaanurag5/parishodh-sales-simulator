import { wordMatchProgress } from "@parishodh/shared";
import type { CoachStatus } from "@parishodh/shared";

interface SuggestedResponseCardProps {
  status: CoachStatus | null;
  suggestion: string | null;
  delivered: boolean;
  learnerSpeaking: boolean;
  learnerPartial: string;
}

type DisplayState = "idle" | "listening" | "generating" | "ready" | "speaking" | "delivered";

function resolveState(props: SuggestedResponseCardProps): DisplayState {
  if (props.learnerSpeaking) return "speaking";
  if (props.delivered) return "delivered";
  if (props.status === "GENERATING") return "generating";
  if (props.status === "LISTENING") return "listening";
  if (props.status === "READY" && props.suggestion) return "ready";
  return "idle";
}

const STATUS_CHIP: Record<Exclude<DisplayState, "idle">, { label: string; className: string }> = {
  listening: { label: "Listening to customer…", className: "text-slate-400" },
  generating: { label: "Generating…", className: "text-slate-400" },
  ready: { label: "Read this to the customer", className: "text-primary" },
  speaking: { label: "● Aarav speaking", className: "text-green" },
  delivered: { label: "✓ Delivered", className: "text-green" },
};

export default function SuggestedResponseCard(props: SuggestedResponseCardProps) {
  const state = resolveState(props);
  const chip = state === "idle" ? null : STATUS_CHIP[state];
  const suggestion = props.suggestion;

  const borderClass =
    state === "speaking"
      ? "border-2 border-green shadow-[0_0_20px_rgba(22,163,74,0.18)]"
      : "border border-border";

  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm transition-all ${borderClass}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          <SparkleIcon />
          Parishodh AI &middot; Suggested Response
        </span>
        {chip && (
          <span
            role="status"
            aria-live="polite"
            className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] ${chip.className}`}
          >
            {chip.label}
          </span>
        )}
      </div>

      {suggestion ? (
        // Karaoke mode re-renders per spoken word; only announce the suggestion once, on arrival.
        <div aria-live={state === "speaking" ? "off" : "polite"}>
          <SuggestionText
            suggestion={suggestion}
            karaoke={state === "speaking"}
            partial={props.learnerPartial}
            faded={state === "listening" || state === "generating"}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-400">Suggestions appear here during the live call.</p>
      )}
    </div>
  );
}

function SuggestionText({
  suggestion,
  karaoke,
  partial,
  faded,
}: {
  suggestion: string;
  karaoke: boolean;
  partial: string;
  faded: boolean;
}) {
  if (!karaoke) {
    return (
      <p className={`text-sm leading-relaxed ${faded ? "text-slate-400" : "text-navy-900"}`}>{suggestion}</p>
    );
  }

  const { matchedWords } = wordMatchProgress(suggestion, partial);
  const words = suggestion.split(/(\s+)/);
  let wordIndex = 0;

  return (
    <p className="text-sm leading-relaxed text-navy-900">
      {words.map((chunk, i) => {
        if (/^\s+$/.test(chunk)) return chunk;
        const isMatched = wordIndex < matchedWords;
        wordIndex += 1;
        return (
          <span key={i} className={isMatched ? "rounded bg-highlight px-0.5" : undefined}>
            {chunk}
          </span>
        );
      })}
    </p>
  );
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="suggestion-sparkle" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0B4AA2" />
        </linearGradient>
      </defs>
      <path
        d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"
        fill="url(#suggestion-sparkle)"
      />
    </svg>
  );
}
