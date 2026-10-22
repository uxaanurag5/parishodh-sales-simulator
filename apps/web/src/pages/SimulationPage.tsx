import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createSimSocket, type SimSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import { useCallStore } from "../store/callStore";
import { useLearnerVoice } from "../hooks/useLearnerVoice";
import { useCustomerVoice } from "../hooks/useCustomerVoice";
import CallTopBar from "../components/call/CallTopBar";
import IncomingCallModal from "../components/call/IncomingCallModal";
import CustomerCard from "../components/call/CustomerCard";
import LiveTranscript from "../components/call/LiveTranscript";
import SuggestedResponseCard from "../components/call/SuggestedResponseCard";
import JudgmentEngineCard from "../components/call/JudgmentEngineCard";
import SatisfactionBar from "../components/call/SatisfactionBar";
import LearnerInputBar from "../components/call/LearnerInputBar";

export default function SimulationPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const autoplay = searchParams.get("autoplay") === "1";
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const socketRef = useRef<SimSocket | null>(null);
  const autoAcceptedRef = useRef(false);

  const status = useCallStore((state) => state.status);
  const stageLabel = useCallStore((state) => state.stageLabel);
  const satisfaction = useCallStore((state) => state.satisfaction);
  const customer = useCallStore((state) => state.customer);
  const customerSpeaking = useCallStore((state) => state.customerSpeaking);
  const customerLevel = useCallStore((state) => state.customerLevel);
  const items = useCallStore((state) => state.items);
  const streamingText = useCallStore((state) => state.streamingText);
  const coachStatus = useCallStore((state) => state.coachStatus);
  const coachSuggestion = useCallStore((state) => state.coachSuggestion);
  const suggestionDelivered = useCallStore((state) => state.suggestionDelivered);
  const learnerSpeaking = useCallStore((state) => state.learnerSpeaking);
  const learnerPartial = useCallStore((state) => state.learnerPartial);
  const captures = useCallStore((state) => state.captures);
  const judgmentEvaluating = useCallStore((state) => state.judgmentEvaluating);
  const satisfactionDelta = useCallStore((state) => state.satisfactionDelta);
  const satisfactionReason = useCallStore((state) => state.satisfactionReason);
  const acceptedAt = useCallStore((state) => state.acceptedAt);
  const error = useCallStore((state) => state.error);

  function sendLearnerLine(text: string) {
    socketRef.current?.emit("learner:final", { text });
    useCallStore.getState().addLearnerTurn(text);
  }

  const customerVoice = useCustomerVoice(true);
  const customerVoiceRef = useRef(customerVoice);
  customerVoiceRef.current = customerVoice;

  const learnerVoice = useLearnerVoice({
    onPartial: (text) => {
      useCallStore.setState({ learnerSpeaking: text.length > 0, learnerPartial: text });
      socketRef.current?.emit("learner:partial", { text });
    },
    onFinal: (text) => sendLearnerLine(text),
  });

  useEffect(() => {
    if (!sessionId) return;
    const store = useCallStore.getState();
    store.reset();

    const socket = createSimSocket();
    socketRef.current = socket;

    socket.on("session:state", (snapshot) => store.applySnapshot(snapshot));
    socket.on("call:ringing", ({ customer: summary }) => store.setRinging(summary));
    socket.on("customer:speaking:start", () => store.startCustomerSpeaking());
    socket.on("customer:text:delta", ({ delta }) => {
      // When TTS is driving the reveal, the delta stream is redundant noise.
      if (!customerVoiceRef.current.supported) store.appendCustomerDelta(delta);
    });
    socket.on("customer:text:final", ({ turn }) => {
      if (useCallStore.getState().status === "ENDED") return;
      customerVoiceRef.current.speakTurn(turn);
    });
    socket.on("coach:status", ({ status: coach }) => store.setCoachStatus(coach));
    socket.on("coach:suggestion", ({ text }) => store.setCoachSuggestion(text));
    socket.on("capture:new", ({ capture }) => store.addCapture(capture));
    socket.on("stage:change", ({ stage, label }) => store.setStage(stage, label));
    socket.on("satisfaction:update", ({ value, delta, reason }) => store.setSatisfaction(value, delta, reason));
    socket.on("session:ended", () => store.markEnded());
    socket.on("session:error", ({ message }) => store.setError(message));
    socket.on("connect", () => socket.emit("session:join", { sessionId }));

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  // Autoplay: accept as soon as the call rings.
  useEffect(() => {
    if (!autoplay || status !== "RINGING" || autoAcceptedRef.current) return;
    autoAcceptedRef.current = true;
    const timer = setTimeout(() => {
      socketRef.current?.emit("call:accept");
      useCallStore.getState().markAccepted();
    }, 600);
    return () => clearTimeout(timer);
  }, [autoplay, status]);

  // Autoplay: read the suggested line as soon as it's ready.
  useEffect(() => {
    if (!autoplay || status !== "ACTIVE") return;
    if (coachStatus !== "READY" || !coachSuggestion) return;
    const timer = setTimeout(() => sendLearnerLine(coachSuggestion), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, status, coachStatus, coachSuggestion]);

  // Auto-dismiss transient session errors (e.g. rate-limit warnings) after a few seconds.
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => useCallStore.getState().setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  // Flow straight into the results presentation once the call ends.
  useEffect(() => {
    if (status !== "ENDED" || !sessionId) return;
    const timer = setTimeout(() => navigate(`/simulation/${sessionId}/results`, { replace: true }), 1200);
    return () => clearTimeout(timer);
  }, [status, sessionId, navigate]);

  function handleAccept() {
    socketRef.current?.emit("call:accept");
    useCallStore.getState().markAccepted();
  }

  function handleDecline() {
    socketRef.current?.emit("call:decline");
    navigate("/dashboard", { replace: true });
  }

  function handleEndCall() {
    socketRef.current?.emit("call:end");
  }

  if (!user) return null;

  const learnerName = user.name.split(" ")[0]?.toUpperCase() ?? "YOU";
  const customerName = customer?.name.toUpperCase() ?? "CUSTOMER";
  const scenarioTitle = customer?.requirement ?? "Simulation";
  const inputDisabled = status !== "ACTIVE" || autoplay;

  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <CallTopBar
        scenarioTitle={scenarioTitle}
        status={status}
        stageLabel={stageLabel}
        acceptedAt={acceptedAt}
        onEndCall={handleEndCall}
        micActive={learnerVoice.pushToTalkActive || learnerVoice.autoMode}
        voiceSupported={learnerVoice.supported}
      />

      <main
        className={`flex-1 bg-panel p-6 transition-opacity ${status === "WAITING" ? "opacity-50" : "opacity-100"}`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="flex flex-col gap-6 lg:h-[calc(100vh-140px)]">
            <CustomerCard
              customer={customer}
              speaking={customerSpeaking}
              level={customerVoice.supported && streamingText.length > 0 ? customerLevel : undefined}
            />
            <div className="h-[420px] lg:h-auto lg:flex-1">
              <LiveTranscript
                items={items}
                streamingText={streamingText}
                customerSpeaking={customerSpeaking}
                learnerName={learnerName}
                customerName={customerName}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <SuggestedResponseCard
              status={coachStatus}
              suggestion={coachSuggestion}
              delivered={suggestionDelivered}
              learnerSpeaking={learnerSpeaking}
              learnerPartial={learnerPartial}
            />
            {status === "ACTIVE" && (
              <LearnerInputBar
                voiceSupported={learnerVoice.supported}
                pushToTalkActive={learnerVoice.pushToTalkActive}
                autoMode={learnerVoice.autoMode}
                micError={learnerVoice.micError}
                onPushToTalkStart={learnerVoice.startPushToTalk}
                onPushToTalkEnd={learnerVoice.stopPushToTalk}
                onToggleAutoMode={learnerVoice.toggleAutoMode}
                onSendText={sendLearnerLine}
                disabled={inputDisabled}
                suggestion={coachStatus === "READY" ? coachSuggestion : null}
              />
            )}
            <JudgmentEngineCard captures={captures} evaluating={judgmentEvaluating} />
            <SatisfactionBar value={satisfaction} delta={satisfactionDelta} reason={satisfactionReason} />
          </div>
        </div>
      </main>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          {error}
        </div>
      )}

      {status === "RINGING" && customer && (
        <IncomingCallModal customer={customer} onAccept={handleAccept} onDecline={handleDecline} />
      )}

      {status === "ENDED" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80">
          <div className="rounded-2xl bg-white p-8 text-center shadow-2xl">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Call ended</h2>
            <p className="mb-6 text-sm text-slate-500">Preparing your results…</p>
            <button
              onClick={() => sessionId && navigate(`/simulation/${sessionId}/results`, { replace: true })}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand"
            >
              View results now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
