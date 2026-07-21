'use client';

import { useState } from 'react';

interface BroadcastBarProps {
  sessionId: string;
}

export default function BroadcastBar({ sessionId }: BroadcastBarProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'message' | 'timer' | 'sticky'>('message');
  const [duration, setDuration] = useState(5);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch('/api/tools/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: message.trim(), messageType, duration: messageType === 'timer' ? duration : undefined }),
      });
      setMessage('');
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/50">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="ประกาศถึงนักเรียน..."
        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
      />
      <select
        value={messageType}
        onChange={(e) => setMessageType(e.target.value as typeof messageType)}
        className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-xs"
      >
        <option value="message">ข้อความ</option>
        <option value="timer">จับเวลา</option>
        <option value="sticky">ปักหมุด</option>
      </select>
      {messageType === 'timer' && (
        <input
          type="number"
          min={1}
          max={300}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-xs text-center"
        />
      )}
      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-medium transition-all"
      >
        ส่ง
      </button>
    </div>
  );
}
