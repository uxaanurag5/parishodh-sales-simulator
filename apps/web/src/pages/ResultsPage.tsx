import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { SessionReport } from "@parishodh/shared";
import { api } from "../lib/api";
import Logo from "../components/Logo";
import StepJudgmentEngine from "../components/results/StepJudgmentEngine";
import StepOutput from "../components/results/StepOutput";
import StepLearningToCapability from "../components/results/StepLearningToCapability";
import StepJourney from "../components/results/StepJourney";
import EndSlide from "../components/results/EndSlide";

const STEPS = [
  { label: "Judgment Engine", caption: "Here's what the Judgment Engine was checking behind the scenes." },
  { label: "Parishodh Output", caption: "And here's the live capability score it produced." },
  { label: "Learning to Capability", caption: "Knowing the material is one thing. Doing the job is another." },
  { label: "The Journey", caption: "From course to call — the full journey so far." },
  { label: "", caption: "" },
] as const;

const AUTO_ADVANCE_MS = 7000;

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["session-report", sessionId],
    queryFn: () => api.get<SessionReport>(`/api/reports/${sessionId}`),
    enabled: Boolean(sessionId),
    retry: 3,
    retryDelay: 1000,
  });

  const lastStep = STEPS.length - 1;
  const goNext = () => setStep((s) => Math.min(lastStep, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goBack();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoAdvance || step >= lastStep) return;
    const timer = setTimeout(goNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdvance, step]);

  const sectionLabel = useMemo(() => STEPS[step]!.label, [step]);

  if (isLoading) {
    return <FullscreenMessage title="Loading your results…" />;
  }
  if (isError || !data) {
    return (
      <FullscreenMessage
        title="Report not ready yet"
        subtitle="Give it a moment and try again from the dashboard."
      />
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-navy-950 text-white"
      style={{
        backgroundImage:
          "radial-gradient(circle at 85% 90%, rgba(27,182,201,0.25), transparent 45%), radial-gradient(circle at 10% 10%, rgba(11,74,162,0.35), transparent 45%)",
      }}
    >
      <header className="flex items-center justify-between px-8 py-6">
        <div className="rounded-xl bg-white px-3 py-1.5">
          <Logo />
        </div>
        {sectionLabel && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-glow">
            {sectionLabel}
          </span>
        )}
      </header>

      <main className="px-6 pb-28 pt-2">
        {step === 0 && <StepJudgmentEngine criteria={data.criteriaResults} />}
        {step === 1 && <StepOutput report={data} />}
        {step === 2 && <StepLearningToCapability report={data} />}
        {step === 3 && <StepJourney report={data} />}
        {step === 4 && (
          <EndSlide
            sessionId={data.sessionId}
            onReplay={() => navigate(`/simulation/${data.sessionId}/replay`)}
            onBackToDashboard={() => navigate("/dashboard")}
          />
        )}
      </main>

      {step < lastStep && (
        <div className="fixed inset-x-0 bottom-6 flex justify-center px-6">
          <div className="flex items-center gap-4 rounded-2xl bg-navy-900/80 px-5 py-3 shadow-xl backdrop-blur">
            <button
              onClick={goBack}
              disabled={step === 0}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:text-white disabled:opacity-30"
            >
              Back
            </button>
            <div className="flex items-center gap-1.5">
              {STEPS.slice(0, lastStep).map((s, i) => (
                <span
                  key={s.label}
                  className={`h-1.5 w-1.5 rounded-full transition ${i === step ? "bg-teal-glow" : "bg-white/25"}`}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand"
            >
              Next
            </button>
            <button
              onClick={() => setAutoAdvance((a) => !a)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                autoAdvance ? "border-teal-glow text-teal-glow" : "border-white/20 text-white/50"
              }`}
            >
              Auto {autoAdvance ? "on" : "off"}
            </button>
          </div>
          {STEPS[step]!.caption && (
            <div className="absolute -top-12 left-1/2 w-full max-w-md -translate-x-1/2 rounded-xl bg-navy-900/70 px-4 py-2 text-center text-xs text-white/70 backdrop-blur">
              {STEPS[step]!.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FullscreenMessage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 text-white">
      <p className="text-sm font-medium">{title}</p>
      {subtitle && <p className="mt-2 text-xs text-white/60">{subtitle}</p>}
    </div>
  );
}
