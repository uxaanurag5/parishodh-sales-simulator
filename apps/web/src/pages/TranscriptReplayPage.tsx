import { useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { SessionReport, Turn } from "@parishodh/shared";
import { api } from "../lib/api";

export default function TranscriptReplayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const shouldPrint = searchParams.get("print") === "1";
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["session-report", sessionId],
    queryFn: () => api.get<SessionReport>(`/api/reports/${sessionId}`),
    enabled: Boolean(sessionId),
  });

  useEffect(() => {
    if (!shouldPrint || !data) return;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [shouldPrint, data]);

  const capturesByTurn = useMemo(() => {
    const map = new Map<string, SessionReport["captures"]>();
    if (!data) return map;
    for (const capture of data.captures) {
      if (!capture.turnId) continue;
      const list = map.get(capture.turnId) ?? [];
      list.push(capture);
      map.set(capture.turnId, list);
    }
    return map;
  }, [data]);

  if (isLoading) return <PageMessage text="Loading transcript…" />;
  if (isError || !data) return <PageMessage text="Transcript not available." />;

  return (
    <div className="min-h-screen bg-panel py-10 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate(`/simulation/${sessionId}/results`)}
            className="text-xs font-semibold text-primary"
          >
            &larr; Back to results
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand"
          >
            Print / Save as PDF
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <h1 className="text-lg font-semibold text-slate-900">
            {data.learnerName} &mdash; {data.scenarioTitle}
          </h1>
          <p className="mb-6 text-sm text-slate-500">
            Live Capability Score {data.report.overallScore}% &middot; {data.report.verdict}
          </p>

          <div className="space-y-4">
            {data.turns.map((turn, i) => {
              const prevStage = i > 0 ? data.turns[i - 1]!.stage : null;
              const captures = capturesByTurn.get(turn.id) ?? [];
              return (
                <div key={turn.id}>
                  {turn.stage !== prevStage && (
                    <div className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {turn.stage.replace(/_/g, " ")}
                    </div>
                  )}
                  <TurnRow turn={turn} learnerName={data.learnerName} customerName={data.customerName} />
                  {(captures.length > 0 || turn.satisfactionAfter !== null) && (
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                      {captures.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-full bg-green-soft px-2 py-0.5 font-medium text-green"
                        >
                          &#10003; {c.label}: {c.value}
                        </span>
                      ))}
                      {turn.satisfactionAfter !== null && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-primary">
                          Satisfaction: {turn.satisfactionAfter}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TurnRow({
  turn,
  learnerName,
  customerName,
}: {
  turn: Turn;
  learnerName: string;
  customerName: string;
}) {
  const isLearner = turn.speaker === "LEARNER";
  return (
    <div className={`flex flex-col ${isLearner ? "items-end" : "items-start"}`}>
      <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {isLearner ? learnerName.split(" ")[0] : customerName}
      </span>
      <span
        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed text-slate-900 ${
          isLearner ? "bg-[#E8F1FD]" : "bg-slate-100"
        }`}
      >
        {turn.text}
      </span>
    </div>
  );
}

function PageMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-panel">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
