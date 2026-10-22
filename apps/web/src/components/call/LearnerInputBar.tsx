import { useState, type FormEvent } from "react";
import type { SttErrorReason } from "../../voice/types";

interface LearnerInputBarProps {
  voiceSupported: boolean;
  pushToTalkActive: boolean;
  autoMode: boolean;
  micError?: SttErrorReason | null;
  onPushToTalkStart: () => void;
  onPushToTalkEnd: () => void;
  onToggleAutoMode: () => void;
  onSendText: (text: string) => void;
  disabled: boolean;
  /** Current AI suggestion; sent verbatim when the box is left empty. */
  suggestion?: string | null;
}

const MIC_ERROR_MESSAGES: Record<SttErrorReason, string> = {
  "permission-denied":
    "Microphone access was denied — allow it in your browser's address-bar icon, or just type your response below.",
  "no-mic": "No microphone was found. You can still type your response below.",
  other: "Voice input hit a snag. You can still type your response below.",
};

export default function LearnerInputBar({
  voiceSupported,
  pushToTalkActive,
  autoMode,
  micError,
  onPushToTalkStart,
  onPushToTalkEnd,
  onToggleAutoMode,
  onSendText,
  disabled,
  suggestion,
}: LearnerInputBarProps) {
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim() || suggestion?.trim() || "";
    if (!text) return;
    onSendText(text);
    setDraft("");
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      {micError && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          {MIC_ERROR_MESSAGES[micError]}
        </div>
      )}
      <div className="flex items-center gap-3">
        {voiceSupported && (
          <>
            <button
              type="button"
              disabled={disabled}
              onMouseDown={onPushToTalkStart}
              onMouseUp={onPushToTalkEnd}
              onMouseLeave={() => pushToTalkActive && onPushToTalkEnd()}
              onTouchStart={onPushToTalkStart}
              onTouchEnd={onPushToTalkEnd}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-50 ${
                pushToTalkActive
                  ? "border-green bg-green text-white"
                  : "border-border bg-white text-slate-500 hover:border-primary hover:text-primary"
              }`}
              title="Hold Space or this button to talk"
            >
              <MicIcon />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={onToggleAutoMode}
              className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                autoMode
                  ? "border-primary bg-blue-50 text-primary"
                  : "border-border text-slate-500 hover:border-primary hover:text-primary"
              }`}
            >
              Auto {autoMode ? "on" : "off"}
            </button>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={disabled}
            placeholder={suggestion ? "Leave blank to send the suggestion as-is…" : "Type your response…"}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || (!draft.trim() && !suggestion?.trim())}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 11a7 7 0 0 1-14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
