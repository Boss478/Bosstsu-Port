'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';
import { useToolPoll } from '@/hooks/use-tool-poll';
import MascotAvatar from './mascots/MascotAvatar';

interface PadletBoardProps {
  session: any;
  stepIndex?: number;
  studentName?: string;
  mascot?: string;
  onMascotEvent?: (event: 'celebrate' | 'correct' | 'wrong') => void;
}

interface Post {
  _id: string;
  studentName?: string;
  mascot?: string;
  content: { message?: string };
  createdAt: string;
}

interface OwnPost {
  _id: string;
  editToken: string;
}

export default function PadletBoard({
  session,
  stepIndex,
  studentName: propName,
  mascot,
  onMascotEvent,
}: PadletBoardProps) {
  const qc = useQueryClient();
  const [studentName, setStudentName] = useState(propName || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [ownPosts, setOwnPosts] = useState<OwnPost[]>([]);

  const STORAGE_KEY = `padlet_${session._id}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try { setOwnPosts(JSON.parse(stored)); } catch { localStorage.removeItem(STORAGE_KEY); }
      }
    }
  }, [session._id]);

  const isOwnPost = (postId: string) => ownPosts.some((p) => p._id === postId);
  const getOwnToken = (postId: string) => ownPosts.find((p) => p._id === postId)?.editToken;

  const { data: pollData, isLoading, refetch, queryKey } = useToolPoll(session._id, stepIndex);
  const posts = (pollData?.responses || []) as Post[];

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tools/poll?sessionId=${session._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'student-token': getStudentToken() },
        body: JSON.stringify({
          studentName: studentName.trim() || undefined,
          mascot,
          content: { message: message.trim() },
          ...(stepIndex !== undefined && { stepIndex }),
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        setError(data.error);
        return;
      }
      setMessage('');
      onMascotEvent?.('celebrate');
      if (data.id && data.editToken && typeof window !== 'undefined') {
        const newOwnPost = { _id: data.id, editToken: data.editToken };
        const updatedOwnPosts = [...ownPosts, newOwnPost];
        setOwnPosts(updatedOwnPosts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOwnPosts));
      }
      qc.invalidateQueries({ queryKey });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    },
    onError: () => setError(t('failedToSubmitSimple')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const token = getOwnToken(postId);
      if (!token) throw new Error('No token');
      const res = await fetch('/api/tools/respond', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'student-token': getStudentToken() },
        body: JSON.stringify({ responseId: postId, editToken: token }),
      });
      return res.json();
    },
    onSuccess: (data, postId) => {
      if (data.error) { setError(data.error); return; }
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.filter((p: OwnPost) => p._id !== postId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setOwnPosts(updated);
        }
      }
      qc.invalidateQueries({ queryKey });
    },
    onError: () => setError(t('failedToSubmitSimple')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError(null);
    submitMutation.mutate();
  };

  const handleDelete = async (postId: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    deleteMutation.mutate(postId);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto p-4 gap-4">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-mono">
          <i aria-hidden="true" className="fi fi-sr-grid" />
          {session.sessionCode}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-3">
          {!propName && (
            <input
              type="text" placeholder={t('yourName')} value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <textarea
            placeholder={session.config?.prompt || t('shareThoughts')}
            value={message} onChange={(e) => setMessage(e.target.value)}
            rows={5} required
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit" disabled={submitMutation.isPending || !message.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {submitMutation.isPending ? t('submitting') : t('postIdea')}
          </button>
        </form>
      </div>

      {isLoading && posts.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ '--sk-base': 'rgba(148,163,184,0.1)', '--sk-shine': 'rgba(148,163,184,0.15)' } as React.CSSProperties}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton p-4 rounded-xl h-32" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          <div className="flex items-center justify-end">
            <button onClick={() => refetch()} disabled={isLoading}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 transition-colors disabled:opacity-50"
              title={t('refresh')}
            >
              <i className={`fi fi-sr-refresh text-sm ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {posts.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm text-center">
              {mascot && (
                <div className="w-16 h-16 mx-auto mb-4 opacity-60">
                  <MascotAvatar mascotId={mascot} size={64} />
                </div>
              )}
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <i aria-hidden="true" className="fi fi-sr-grid text-xl text-blue-500" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-1">{t('noPostsYet')}</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">{t('beFirstToPost')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <div key={post._id} className="animate-fade-slide-up p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    {post.mascot && (
                      <div className="w-5 h-5 rounded overflow-hidden shrink-0">
                        <MascotAvatar mascotId={post.mascot} size={20} />
                      </div>
                    )}
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate flex-1 min-w-0">
                      {post.studentName || t('anonymous')}
                    </span>
                    <div className="flex items-center gap-2">
                      {isOwnPost(post._id) && (
                        <button onClick={() => handleDelete(post._id)}
                          className="p-1 text-zinc-400 hover:text-red-500 transition-colors" title={t('delete')}
                        >
                          <i aria-hidden="true" className="fi fi-sr-trash text-xs" />
                        </button>
                      )}
                      <span className="text-[10px] text-zinc-400">
                        {new Date(post.createdAt).toLocaleTimeString('th-TH', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 break-words">{post.content?.message}</p>
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
