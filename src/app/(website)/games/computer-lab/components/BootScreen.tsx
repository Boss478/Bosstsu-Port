"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { LangCode, GameMode } from "../types";
import { t } from "../lang";

interface BootScreenProps {
  lang: LangCode;
  mode: GameMode;
  onComplete: () => void;
  onDevMode: () => void;
}

export default function BootScreen({ lang, mode, onComplete, onDevMode }: BootScreenProps) {
  const [bootStage, setBootStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lines = [
    t("boot.title", lang, mode),
    "",
    t("boot.cpu", lang, mode),
    t("boot.ram", lang, mode),
    t("boot.hdd", lang, mode),
    t("boot.gpu", lang, mode),
    "",
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    inputRef.current += e.key.toLowerCase();
    if (inputRef.current.length > 3) {
      inputRef.current = inputRef.current.slice(-3);
    }
    if (inputRef.current === "dev") {
      onDevMode();
      onComplete();
    }
  }, [onComplete, onDevMode]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const bootLines = 6;
    const lineDelay = 400;
    const progressDuration = 2000;

    const startBoot = () => {
      timerRef.current = setTimeout(() => {
        setBootStage(bootLines);
        const progressInterval = setInterval(() => {
          setProgress((p) => {
            if (p >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return p + 5;
          });
        }, progressDuration / 20);
      }, bootLines * lineDelay);
    };

    const stageInterval = setInterval(() => {
      setBootStage((s) => {
        if (s >= bootLines - 1) {
          clearInterval(stageInterval);
          return s;
        }
        return s + 1;
      });
    }, lineDelay);

    startBoot();

    return () => {
      clearInterval(stageInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (bootStage >= 6 && progress >= 100) {
      onComplete();
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-full bg-black text-green-400 font-mono p-8 cursor-pointer"
      onClick={handleClick}
    >
      <div className="text-left w-full max-w-md space-y-1">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`text-sm leading-relaxed transition-opacity duration-300 ${
              i <= bootStage ? "opacity-100" : "opacity-0"
            }`}
          >
            {line ? `[${line}]` : ""}
          </p>
        ))}

        {bootStage >= 6 && progress >= 100 && (
          <>
            <div className="mt-4 w-full h-2 bg-zinc-900 rounded overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm animate-pulse">
              &gt; {t("boot.start", lang, mode)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
