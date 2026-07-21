'use client';

import { useState, useEffect } from 'react';

interface BroadcastBannerProps {
  message: string;
  messageType: 'message' | 'timer' | 'sticky';
  duration?: number;
  onDismiss: () => void;
}

export default function BroadcastBanner({ message, messageType, duration, onDismiss }: BroadcastBannerProps) {
  const [timer, setTimer] = useState(duration ?? 0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    setTimer(duration ?? 0);

    if (messageType === 'message' && duration) {
      const t = setTimeout(() => { setVisible(false); onDismiss(); }, duration * 1000);
      return () => clearTimeout(t);
    }
  }, [message, messageType, duration, onDismiss]);

  useEffect(() => {
    if (messageType !== 'timer' || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setVisible(false);
          onDismiss();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [messageType, timer, onDismiss]);

  if (!visible) return null;

  const typeStyles = {
    message: 'bg-sky-500/90 text-white',
    timer: 'bg-amber-500/90 text-white',
    sticky: 'bg-violet-500/90 text-white',
  };

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${typeStyles[messageType]} animate-slide-down`}>
      <i className={`fi ${messageType === 'timer' ? 'fi-sr-hourglass' : messageType === 'sticky' ? 'fi-sr-pin' : 'fi-sr-megaphone'} text-lg`} />
      <span className="text-sm font-medium">{message}</span>
      {messageType === 'timer' && (
        <span className="text-lg font-bold tabular-nums">{timer}s</span>
      )}
      <button
        onClick={() => { setVisible(false); onDismiss(); }}
        className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <i className="fi fi-sr-cross text-sm" />
      </button>
    </div>
  );
}
