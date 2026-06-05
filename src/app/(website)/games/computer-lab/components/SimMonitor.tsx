"use client";

import { useRef, useEffect, useState } from "react";

interface SimMonitorProps {
  history: string[];
  currentOutput?: string;
  isTyping?: boolean;
  className?: string;
}

function typewrite(text: string, onChar: (full: string) => void, speed: number = 20): () => void {
  let idx = 0;
  let current = "";
  const timer = setInterval(() => {
    if (idx >= text.length) { clearInterval(timer); return; }
    current += text[idx];
    onChar(current);
    idx++;
  }, speed);
  return () => clearInterval(timer);
}

export default function SimMonitor({ history, currentOutput, isTyping, className = "" }: SimMonitorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [typedText, setTypedText] = useState("");
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (cleanupRef.current) cleanupRef.current();

    const run = () => {
      if (currentOutput && isTyping) {
        setTypedText("");
        cleanupRef.current = typewrite(currentOutput, setTypedText);
      } else if (currentOutput) {
        setTypedText(currentOutput);
      }
    };

    const timeoutId = setTimeout(run, 0);
    return () => {
      clearTimeout(timeoutId);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [currentOutput, isTyping]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, typedText]);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden border border-green-900/50 font-mono text-xs leading-relaxed ${className}`}>
      {/* CRT scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]">
        <div className="w-full h-px bg-green-500 animate-crt-scanline" />
      </div>

      {/* CRT glow */}
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_30px_rgba(0,255,65,0.05)]" />

      {/* Content */}
      <div ref={scrollRef} className="relative z-0 p-3 h-full overflow-y-auto no-scrollbar">
        {history.length === 0 && !currentOutput && (
          <span className="text-green-900/50 animate-terminal-blink">_</span>
        )}

        {history.map((line, i) => (
          <div key={i} className="text-green-400/90 whitespace-pre-wrap break-all">
            {line}
          </div>
        ))}

        {currentOutput && (
          <div className="text-green-400 mt-1 whitespace-pre-wrap break-all">
            {typedText}
            {(isTyping || typedText.length < (currentOutput?.length ?? 0)) && (
              <span className="animate-terminal-blink text-green-500">▌</span>
            )}
          </div>
        )}

        {!currentOutput && history.length > 0 && (
          <span className="animate-terminal-blink text-green-500">▌</span>
        )}
      </div>

      {/* Status bar */}
      <div className="relative z-0 border-t border-green-900/30 px-3 py-1 flex justify-between text-[8px] text-green-800">
        <span>CRT v1.0</span>
        <span>{history.length} lines</span>
        {isTyping && <span className="animate-pulse">RX</span>}
      </div>
    </div>
  );
}
