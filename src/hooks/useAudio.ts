"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);

  const getCtx = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx = ctxRef.current;
    if (!ctx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctxRef.current = new AudioContextClass() as AudioContext;
    }
    const current = ctxRef.current!;
    if (current.state === 'suspended') {
      current.resume();
    }
    return current;
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

  const playSequence = useCallback(
    (frequencies: number[], noteDuration = 0.15, gainVal = 0.12) => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(gainVal, now + i * noteDuration);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * noteDuration + noteDuration);
        osc.start(now + i * noteDuration);
        osc.stop(now + i * noteDuration + noteDuration);
      });
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
      const stored = storedVoiceRef.current;
      if (stored) {
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find(v => v.voiceURI === stored);
        if (match) utterance.voice = match;
      }
      window.speechSynthesis.speak(utterance);
    },
    [muted]
  );

  const [voiceURI, setVoiceURI] = useState("");
  const storedVoiceRef = useRef("");

  useEffect(() => {
    storedVoiceRef.current = voiceURI;
  }, [voiceURI]);

  return { playSound, speak, muted, toggleMute, playSequence, voiceURI, setVoiceURI } as const;
}
