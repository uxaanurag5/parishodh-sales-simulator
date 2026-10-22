import Logo from "../Logo";

interface EndSlideProps {
  sessionId: string;
  onReplay: () => void;
  onBackToDashboard: () => void;
}

export default function EndSlide({ sessionId, onReplay, onBackToDashboard }: EndSlideProps) {
  function handleDownload() {
    window.open(`/simulation/${sessionId}/replay?print=1`, "_blank");
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 pt-16 text-center">
      <Logo variant="light" />
      <p className="max-w-sm text-sm text-white/70">Learn. Practice. Simulate. Measure Capability.</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleDownload}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand"
        >
          Download report (PDF)
        </button>
        <button
          onClick={onReplay}
          className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
        >
          Replay call
        </button>
        <button
          onClick={onBackToDashboard}
          className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
