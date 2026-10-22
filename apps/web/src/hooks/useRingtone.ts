import { useEffect, useState } from "react";

/** Soft two-pulse ringtone using the Web Audio API, no asset files needed. */
export function useRingtone(active: boolean) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!active || muted) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    void ctx.resume().catch(() => {});
    let stopped = false;

    function ping() {
      if (stopped) return;
      const now = ctx.currentTime;
      for (const offset of [0, 0.18]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 480;
        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.05, now + offset + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + offset + 0.16);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
      }
    }

    ping();
    const interval = setInterval(ping, 1600);

    return () => {
      stopped = true;
      clearInterval(interval);
      void ctx.close().catch(() => {});
    };
  }, [active, muted]);

  return { muted, toggleMute: () => setMuted((m) => !m) };
}
