"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getAudioCacheEntry, setAudioCacheEntry } from '@/lib/audio-cache-db';

const MUTED_KEY = 'boss478-muted';
const VOICE_KEY = 'boss478-voice-uri';
const ALT_VOICE_KEY = 'alphabet-adventure-voice';
const SPEECH_RATE_KEY = 'boss478-speech-rate';
const SPEECH_PITCH_KEY = 'boss478-speech-pitch';

let audioFetchQueue: Promise<void> = Promise.resolve();
const memAudioCache = new Map<string, string | null>();

async function fetchWordAudioUrl(word: string): Promise<string | null> {
  const key = word.toLowerCase();
  const memCached = memAudioCache.get(key);
  if (memCached !== undefined) return memCached;

  try {
    const persisted = await getAudioCacheEntry(key);
    if (persisted !== undefined) {
      const url = persisted || null;
      memAudioCache.set(key, url);
      return url;
    }
  } catch {
    // IndexedDB unavailable, fall through to API fetch
  }

  const url = await new Promise<string | null>((resolve) => {
    audioFetchQueue = audioFetchQueue.then(async () => {
      try {
        const res = await fetch(
          `/api/dictionary?word=${encodeURIComponent(key)}`,
        );
        if (!res.ok) { resolve(null); return; }
        const data = await res.json();
        resolve(data.audioUrl ?? null);
      } catch {
        resolve(null);
      }
    });
  });

  memAudioCache.set(key, url);
  setAudioCacheEntry(key, url ?? ''); // fire-and-forget
  return url;
}

function createLRUCache<K, V>(maxSize: number) {
  const map = new Map<K, V>();
  return {
    get(key: K): V | undefined {
      const val = map.get(key);
      if (val !== undefined) {
        map.delete(key);
        map.set(key, val);
      }
      return val;
    },
    set(key: K, value: V) {
      map.delete(key);
      map.set(key, value);
      if (map.size > maxSize) {
        const firstKey = map.keys().next().value;
        if (firstKey !== undefined) map.delete(firstKey);
      }
    },
    has(key: K) { return map.has(key); },
  };
}

const decodedAudioCache = createLRUCache<string, AudioBuffer | null>(200);

async function decodeAudioDataUrl(ctx: AudioContext, dataUrl: string): Promise<AudioBuffer | null> {
  try {
    if (dataUrl.startsWith("data:")) {
      const parts = dataUrl.split(",");
      if (parts.length > 1) {
        const isBase64 = parts[0].includes("base64");
        const rawData = parts[1];
        let arrayBuffer: ArrayBuffer;
        if (isBase64) {
          const binaryString = window.atob(rawData);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } else {
          const decoded = decodeURIComponent(rawData);
          const len = decoded.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = decoded.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        }
        return await ctx.decodeAudioData(arrayBuffer);
      }
    }
    const res = await fetch(dataUrl);
    const arrayBuffer = await res.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.error("Failed to decode audio data URL:", err);
    return null;
  }
}

async function getOrDecodeAudioBuffer(ctx: AudioContext, word: string): Promise<AudioBuffer | null> {
  if (word.startsWith("data:")) {
    return await decodeAudioDataUrl(ctx, word);
  }

  const key = word.toLowerCase();
  const cached = decodedAudioCache.get(key);
  if (cached !== undefined) return cached;

  try {
    const url = await fetchWordAudioUrl(key);
    if (url && url.startsWith("data:")) {
      const buffer = await decodeAudioDataUrl(ctx, url);
      if (buffer) {
        decodedAudioCache.set(key, buffer);
        return buffer;
      }
    }
  } catch (err) {
    console.error("Error in getOrDecodeAudioBuffer:", err);
  }
  decodedAudioCache.set(key, null);
  return null;
}

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(MUTED_KEY) === 'true';
    }
    return false;
  });

  const getCtx = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx = ctxRef.current;
    if (!ctx) {
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

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(MUTED_KEY, String(next));
      return next;
    });
  }, []);

  const playSound = useCallback(
    (type: "correct" | "wrong" | "win" | "tada") => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const cleanup = (source: AudioScheduledSourceNode, gain: GainNode) => {
        source.onended = () => { source.disconnect(); gain.disconnect(); };
      };

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
        cleanup(osc, gain);
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
        cleanup(osc, gain);
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
          cleanup(osc, gain);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.2);
        });
      } else if (type === "tada") {
        [523, 659, 784, 1047].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.01, now + i * 0.12);
          gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.35);
          cleanup(osc, gain);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.35);
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
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        osc.start(now + i * noteDuration);
        osc.stop(now + i * noteDuration + noteDuration);
      });
    },
    [muted, getCtx]
  );

  const [speechUnavailable] = useState(() => {
    if (typeof window !== 'undefined') {
      return !('speechSynthesis' in window) && !('AudioContext' in window || 'webkitAudioContext' in window);
    }
    return false;
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURIBase] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(VOICE_KEY) ?? localStorage.getItem(ALT_VOICE_KEY) ?? "";
    }
    return "";
  });
  const storedVoiceRef = useRef(voiceURI);

  const [speechRate, setSpeechRateBase] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SPEECH_RATE_KEY);
      return saved ? parseFloat(saved) : 0.85;
    }
    return 0.85;
  });

  const [speechPitch, setSpeechPitchBase] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SPEECH_PITCH_KEY);
      return saved ? parseFloat(saved) : 1.0;
    }
    return 1.0;
  });

  const storedRateRef = useRef(speechRate);
  const storedPitchRef = useRef(speechPitch);

  useEffect(() => {
    storedRateRef.current = speechRate;
  }, [speechRate]);

  useEffect(() => {
    storedPitchRef.current = speechPitch;
  }, [speechPitch]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    
    // Polling backup to ensure voices are loaded even if the event is missed
    const t1 = setTimeout(updateVoices, 100);
    const t2 = setTimeout(updateVoices, 500);
    const t3 = setTimeout(updateVoices, 1000);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    storedVoiceRef.current = voiceURI;
  }, [voiceURI]);

  const setVoiceURI = useCallback((uri: string) => {
    setVoiceURIBase(uri);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VOICE_KEY, uri);
      localStorage.setItem(ALT_VOICE_KEY, uri);
    }
  }, []);

  const setSpeechRate = useCallback((rate: number) => {
    setSpeechRateBase(rate);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPEECH_RATE_KEY, String(rate));
    }
  }, []);

  const setSpeechPitch = useCallback((pitch: number) => {
    setSpeechPitchBase(pitch);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPEECH_PITCH_KEY, String(pitch));
    }
  }, []);

  const speak = useCallback(
    (text: string, lang = "en-US") => {
      if (muted) return;
      if (!("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = storedRateRef.current;
      utterance.pitch = storedPitchRef.current;
      
      const currentVoices = window.speechSynthesis.getVoices();
      const stored = storedVoiceRef.current;
      let matchedVoice: SpeechSynthesisVoice | undefined;

      if (stored) {
        matchedVoice = currentVoices.find(v => v.voiceURI === stored);
      }
      
      if (!matchedVoice) {
        // Fallback: search for voices matching the requested language
        const langPrefix = lang.split("-")[0].toLowerCase();
        const langVoices = currentVoices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
        if (langVoices.length > 0) {
          if (langPrefix === "en") {
            // Prioritize high-quality English voices
            matchedVoice = langVoices.find(v => 
              v.name.includes("Google") || 
              v.name.includes("Natural") || 
              v.name.includes("Samantha") || 
              v.name.includes("Premium")
            ) || langVoices[0];
          } else if (langPrefix === "th") {
            // Prioritize high-quality Thai voices (e.g. Google, Narisa, Premwadee)
            matchedVoice = langVoices.find(v =>
              v.name.includes("Google") ||
              v.name.includes("Narisa") ||
              v.name.includes("Premwadee") ||
              v.name.includes("Premium")
            ) || langVoices[0];
          } else {
            matchedVoice = langVoices[0];
          }
        }
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [muted]
  );

  const playWordAudio = useCallback(
    async (word: string) => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;

      const buffer = await getOrDecodeAudioBuffer(ctx, word);
      if (buffer) {
        try {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          const gain = ctx.createGain();
          gain.gain.value = 0.5;
          source.connect(gain);
          gain.connect(ctx.destination);
          source.onended = () => { source.disconnect(); gain.disconnect(); };
          source.start(0);
          source.stop(ctx.currentTime + buffer.duration);
        } catch {
          speak(word);
        }
      } else {
        speak(word);
      }
    },
    [muted, getCtx, speak]
  );

  const playPhonemeAudio = useCallback(
    async (exampleWord: string, fallbackText: string, trimDurationMs: number) => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) {
        speak(fallbackText);
        return;
      }

      const buffer = await getOrDecodeAudioBuffer(ctx, exampleWord);
      if (!buffer) {
        speak(fallbackText);
        return;
      }

      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = 0.5;
        source.connect(gain);
        gain.connect(ctx.destination);

        source.onended = () => { source.disconnect(); gain.disconnect(); };

        const now = ctx.currentTime;
        const fadeEnd = trimDurationMs / 1000;
        const fadeStart = Math.max(0, fadeEnd - 0.05);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.setValueAtTime(0.5, now + fadeStart);
        gain.gain.linearRampToValueAtTime(0.001, now + fadeEnd);

        source.start(now);
        source.stop(now + fadeEnd);
      } catch {
        speak(fallbackText);
      }
    },
    [muted, getCtx, speak]
  );

  const prefetchWords = useCallback(
    async (words: string[], onProgress?: (loaded: number, total: number) => void) => {
      const ctx = getCtx();
      if (!ctx) {
        onProgress?.(words.length, words.length);
        return;
      }
      
      let loaded = 0;
      const total = words.length;
      if (total === 0) {
        onProgress?.(0, 0);
        return;
      }

      // Fetch and decode in parallel
      await Promise.all(
        words.map(async (word) => {
          try {
            await getOrDecodeAudioBuffer(ctx, word);
          } catch {
            // ignore
          } finally {
            loaded++;
            onProgress?.(loaded, total);
          }
        })
      );
    },
    [getCtx]
  );

  return { playSound, speak, playWordAudio, playPhonemeAudio, muted, toggleMute, playSequence, voiceURI, setVoiceURI, voices, prefetchWords, speechRate, setSpeechRate, speechPitch, setSpeechPitch, speechUnavailable } as const;
}
