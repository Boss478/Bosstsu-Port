'use client';

import { useState, useEffect, useRef } from 'react';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';

interface PadletBoardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  stepIndex?: number;
}

interface Post {
  _id: string;
  studentName?: string;
  content: { message?: string };
  createdAt: string;
}

interface OwnPost {
  _id: string;
  editToken: string;
}

export default function PadletBoard({ session, stepIndex }: PadletBoardProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [message, setMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [ownPosts, setOwnPosts] = useState<OwnPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const STORAGE_KEY = `padlet_${session._id}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setOwnPosts(JSON.parse(stored));
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [session._id]);

  const isOwnPost = (postId: string) => ownPosts.some(p => p._id === postId);
  const getOwnToken = (postId: string) => ownPosts.find(p => p._id === postId)?.editToken;

  const fetchPosts = async (since?: number) => {
    try {
      const url = `/api/tools/poll?sessionId=${session._id}${since ? `&since=${since}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.responses) {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const newPosts = data.responses.filter((r: Post) => !existingIds.has(r._id));
          const merged = since ? [...prev, ...newPosts] : newPosts.length ? newPosts : prev;
          return merged.length ? merged : data.responses;
        });
        setLastFetch(Date.now());
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(() => fetchPosts(lastFetch), 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/poll?sessionId=${session._id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'student-token': getStudentToken(),
        },
        body: JSON.stringify({
          studentName: studentName.trim() || undefined,
          content: { message: message.trim() },
          ...(stepIndex !== undefined && { stepIndex }),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('');
        fetchPosts();
        if (data.id && data.editToken && typeof window !== 'undefined') {
          const newOwnPost = { _id: data.id, editToken: data.editToken };
          const updatedOwnPosts = [...ownPosts, newOwnPost];
          setOwnPosts(updatedOwnPosts);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOwnPosts));
        }
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
      }
    } catch {
      setError(t('failedToSubmitSimple'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    const token = getOwnToken(postId);
    if (!token) return;

    try {
      const res = await fetch('/api/tools/respond', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'student-token': getStudentToken(),
        },
        body: JSON.stringify({ responseId: postId, editToken: token }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPosts(prev => prev.filter(p => p._id !== postId));
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            const updated = parsed.filter((p: OwnPost) => p._id !== postId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            setOwnPosts(updated);
          }
        }
      }
    } catch {
      setError(t('failedToSubmitSimple'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto p-4 gap-4">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-mono">
          <i className="fi fi-sr-grid" />
          {session.sessionCode}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder={t('yourName')}
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder={session.config?.prompt || t('shareThoughts')}
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? t('submitting') : t('postIdea')}
          </button>
        </form>
      </div>

      {loading && posts.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">{t('loading')}</div>
      ) : (
        <div className="space-y-4 pb-4">
          <div className="flex items-center justify-end">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 transition-colors disabled:opacity-50"
              title={t('refresh')}
            >
              <i className={`fi fi-sr-refresh text-sm ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(post => (
            <div key={post._id} className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate max-w-[120px]">
                  {post.studentName || t('anonymous')}
                </span>
                <div className="flex items-center gap-2">
                  {isOwnPost(post._id) && (
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                      title={t('delete')}
                    >
                      <i className="fi fi-sr-trash text-xs" />
                    </button>
                  )}
                  <span className="text-[10px] text-zinc-400">
                    {new Date(post.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 break-words">{post.content?.message}</p>
            </div>
          ))}
          </div>
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}