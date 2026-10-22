import Logo from "../Logo";
import StagePill from "./StagePill";
import CallStatusPill from "./CallStatusPill";
import type { SimSessionStatus } from "@parishodh/shared";

interface CallTopBarProps {
  scenarioTitle: string;
  status: SimSessionStatus;
  stageLabel: string | null;
  acceptedAt: number | null;
  onEndCall: () => void;
  micActive: boolean;
  voiceSupported: boolean;
}

export default function CallTopBar({
  scenarioTitle,
  status,
  stageLabel,
  acceptedAt,
  onEndCall,
  micActive,
  voiceSupported,
}: CallTopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-navy-900 px-6 py-4">
      <div className="flex items-center gap-4">
        <Logo variant="light" />
        <div className="hidden text-sm font-medium text-white/80 sm:block">
          Live Sales Simulation &middot; {scenarioTitle}
        </div>
        <StagePill label={stageLabel} />
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] sm:flex ${
            micActive ? "border-green/40 text-green" : "border-white/15 text-white/50"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${micActive ? "bg-green" : "bg-white/30"}`} />
          {!voiceSupported ? "Mic unsupported" : micActive ? "Mic live" : "Mic off"}
        </span>
        <CallStatusPill status={status} acceptedAt={acceptedAt} />
        {status === "ACTIVE" && (
          <button
            onClick={onEndCall}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
          >
            End call
          </button>
        )}
      </div>
    </header>
  );
}
