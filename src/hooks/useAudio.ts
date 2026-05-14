"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);

  const getCtx = useCallback(() => {
    const AudioContextClass =
      (window as Window).AudioContext ||
      (window as Window & { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContextClass();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  useEffect(() => {
    return () => {
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const playSound = useCallback(
    (type: "correct" | "wrong" | "win") => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === "correct") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "wrong") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "win") {
        [400, 500, 600, 800].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.value = 0.1;
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.2);
        });
      }
    },
    [muted, getCtx]
  );

  const speak = useCallback(
    (text: string, lang = "en-US") => {
      if (muted) return;
      if (!("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    },
    [muted]
  );

  return { playSound, speak, muted, toggleMute } as const;
}
