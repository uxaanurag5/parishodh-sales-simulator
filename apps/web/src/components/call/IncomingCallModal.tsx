import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { CustomerSummary } from "../../store/callStore";
import { useRingtone } from "../../hooks/useRingtone";

interface IncomingCallModalProps {
  customer: CustomerSummary;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({ customer, onAccept, onDecline }: IncomingCallModalProps) {
  const { muted, toggleMute } = useRingtone(true);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    acceptButtonRef.current?.focus();
  }, []);

  function handleDecline() {
    if (window.confirm("Decline this call and return to the dashboard?")) {
      onDecline();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="incoming-call-title"
        className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl"
      >
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-green/30" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green text-white">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"
                fill="currentColor"
              />
            </svg>
          </span>
        </div>

        <h2 id="incoming-call-title" className="mb-6 text-lg font-semibold text-slate-900">
          Incoming Customer Call
        </h2>

        <div className="mb-6 grid grid-cols-2 gap-4 text-left">
          <Field label="Customer" value={customer.name} />
          <Field label="Requirement" value={customer.requirement} />
          <Field label="Intent" value={customer.intent} />
          <Field label="Preferred Colour" value={customer.preferredColour} />
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            ref={acceptButtonRef}
            onClick={onAccept}
            className="flex-1 rounded-lg bg-green py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Accept
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            Decline
          </button>
        </div>

        <button
          onClick={toggleMute}
          className="mt-4 text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
        >
          {muted ? "Unmute ringtone" : "Mute ringtone"}
        </button>
      </motion.div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
