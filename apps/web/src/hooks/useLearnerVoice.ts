import { useEffect, useMemo, useRef, useState } from "react";
import { WebSpeechStt } from "../voice";
import type { SttErrorReason } from "../voice/types";

interface UseLearnerVoiceOptions {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
}

const SILENCE_MS = 1200;

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(target.tagName);
}

/** Push-to-talk (hold Space or the mic button) plus an auto mode that ends on ~1.2s of silence. */
export function useLearnerVoice({ onPartial, onFinal }: UseLearnerVoiceOptions) {
  const stt = useMemo(() => new WebSpeechStt(), []);
  const supported = stt.isSupported();
  const [pushToTalkActive, setPushToTalkActive] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [micError, setMicError] = useState<SttErrorReason | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPartialRef = useRef("");
  const autoModeRef = useRef(autoMode);
  autoModeRef.current = autoMode;

  useEffect(() => {
    const unsubPartial = stt.onPartial((text) => {
      latestPartialRef.current = text;
      onPartial(text);
      if (autoModeRef.current) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const finalText = latestPartialRef.current.trim();
          latestPartialRef.current = "";
          if (finalText) onFinal(finalText);
          onPartial("");
        }, SILENCE_MS);
      }
    });
    const unsubFinal = stt.onFinal((text) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      latestPartialRef.current = "";
      onFinal(text);
    });
    const unsubError = stt.onError((reason) => {
      setMicError(reason);
      setPushToTalkActive(false);
      setAutoMode(false);
    });
    return () => {
      unsubPartial();
      unsubFinal();
      unsubError();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // onPartial/onFinal identity is expected to stay stable for the call's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt]);

  useEffect(() => () => stt.stop(), [stt]);

  function startPushToTalk() {
    if (!supported) return;
    setMicError(null);
    setPushToTalkActive(true);
    stt.start();
  }

  function stopPushToTalk() {
    if (!supported) return;
    setPushToTalkActive(false);
    stt.stop();
  }

  function toggleAutoMode() {
    setAutoMode((enabled) => {
      const next = !enabled;
      if (next) {
        setMicError(null);
        stt.start();
      } else {
        stt.stop();
      }
      return next;
    });
  }

  useEffect(() => {
    if (!supported) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || event.repeat || isTypingTarget(event.target)) return;
      event.preventDefault();
      startPushToTalk();
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (event.code !== "Space" || isTypingTarget(event.target)) return;
      event.preventDefault();
      stopPushToTalk();
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  return { supported, pushToTalkActive, autoMode, micError, startPushToTalk, stopPushToTalk, toggleAutoMode };
}
