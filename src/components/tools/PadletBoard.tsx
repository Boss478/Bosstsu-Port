'use client';

import { useState, useEffect, useRef } from 'react';

interface PadletBoardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

interface Post {
  _id: string;
  studentName?: string;
  content: { message?: string };
  createdAt: string;
}

export default function PadletBoard({ session }: PadletBoardProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [message, setMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName.trim() || undefined,
          content: { message: message.trim() },
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('');
        fetchPosts();
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
      }
    } catch {
      setError('Failed to submit');
    } finally {
      setSubmitting(false);
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
            placeholder="Your name"
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder={session.config?.prompt || 'Share your idea...'}
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Post Idea'}
          </button>
        </form>
      </div>

      {loading && posts.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {posts.map(post => (
            <div key={post._id} className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {post.studentName || 'Anonymous'}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {new Date(post.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{post.content?.message}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}