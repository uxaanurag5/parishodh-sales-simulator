import { useEffect, useState } from "react";
import type { SimSessionStatus } from "@parishodh/shared";

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function CallStatusPill({
  status,
  acceptedAt,
}: {
  status: SimSessionStatus;
  acceptedAt: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "ACTIVE") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === "ACTIVE" && acceptedAt) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-green-soft px-3 py-1 text-xs font-semibold text-green">
        <span className="h-1.5 w-1.5 rounded-full bg-green" />
        Live &middot; {formatElapsed(now - acceptedAt)}
      </span>
    );
  }

  if (status === "RINGING") {
    return (
      <span className="flex animate-pulse items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber">
        <span className="h-1.5 w-1.5 rounded-full bg-amber" />
        Ringing
      </span>
    );
  }

  if (status === "ENDED") {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
        Ended
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
      Waiting
    </span>
  );
}
