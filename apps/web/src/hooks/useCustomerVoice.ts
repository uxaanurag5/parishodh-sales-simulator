import { useEffect, useMemo, useRef } from "react";
import type { Turn } from "@parishodh/shared";
import { WebSpeechTts } from "../voice";
import { useCallStore } from "../store/callStore";

/**
 * Speaks the customer's finalized lines aloud. The waveform/SPEAKING state
 * and the bubble's progressive reveal are both driven by real TTS events
 * (CLAUDE.md: "Customer TTS drives the waveform and the SPEAKING state").
 * Falls back to immediately finalizing the turn when TTS is unavailable.
 */
export function useCustomerVoice(enabled: boolean) {
  const tts = useMemo(() => new WebSpeechTts(), []);
  const supported = enabled && tts.isSupported();
  const pendingRef = useRef<Turn | null>(null);

  useEffect(() => {
    if (!supported) return;
    const unsubLevel = tts.onLevel((level) => useCallStore.getState().setCustomerLevel(level));
    const unsubBoundary = tts.onBoundary((charIndex) => {
      const turn = pendingRef.current;
      if (!turn) return;
      useCallStore.getState().setStreamingText(turn.text.slice(0, charIndex));
    });
    const unsubEnd = tts.onEnd(() => {
      const turn = pendingRef.current;
      pendingRef.current = null;
      if (turn) useCallStore.getState().finalizeCustomerTurn(turn);
    });
    return () => {
      unsubLevel();
      unsubBoundary();
      unsubEnd();
      tts.cancel();
    };
  }, [tts, supported]);

  function speakTurn(turn: Turn) {
    if (!supported) {
      useCallStore.getState().finalizeCustomerTurn(turn);
      return;
    }
    pendingRef.current = turn;
    useCallStore.setState({ customerSpeaking: true, streamingText: "" });
    tts.speak(turn.text);
  }

  return { supported, speakTurn };
}
