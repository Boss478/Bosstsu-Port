"use client";

import { useEffect, useRef } from "react";

const KONAMI: string[] = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "KeyB", "KeyA",
];

export function useKonamiCode(onActivate: () => void): void {
  const cb = useRef(onActivate);
  useEffect(() => { cb.current = onActivate; });

  useEffect(() => {
    let seq: string[] = [];

    function handler(e: KeyboardEvent) {
      seq.push(e.code);
      if (seq.length > KONAMI.length) {
        seq = seq.slice(-KONAMI.length);
      }
      if (
        seq.length === KONAMI.length &&
        seq.every((k, i) => k === KONAMI[i])
      ) {
        cb.current();
        seq = [];
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
