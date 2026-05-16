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

interface OwnPost {
  _id: string;
  editToken: string;
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
  const [ownPosts, setOwnPosts] = useState<OwnPost[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [editSaving, setEditSaving] = useState(false);
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
        if (data.id && data.editToken && typeof window !== 'undefined') {
          const newOwnPost = { _id: data.id, editToken: data.editToken };
          const updatedOwnPosts = [...ownPosts, newOwnPost];
          setOwnPosts(updatedOwnPosts);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOwnPosts));
        }
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
      }
    } catch {
      setError('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleEditClick = (post: Post) => {
    setEditingPostId(post._id);
    setEditMessage(post.content?.message || '');
  };

  const handleEditCancel = () => {
    setEditingPostId(null);
    setEditMessage('');
  };

  const handleEditSave = async (postId: string) => {
    if (!editMessage.trim()) return;
    const token = getOwnToken(postId);
    if (!token) return;

    setEditSaving(true);
    try {
      const res = await fetch('/api/tools/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: postId,
          editToken: token,
          content: { message: editMessage.trim() },
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setEditingPostId(null);
        setEditMessage('');
        fetchPosts();
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            const updated = parsed.map((p: OwnPost) =>
              p._id === postId ? { ...p, content: { message: editMessage.trim() } } : p
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          }
        }
      }
    } catch {
      setError('Failed to save');
    } finally {
      setEditSaving(false);
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
        <div className="space-y-4 pb-4">
          <div className="flex items-center justify-end">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <i className={`fi fi-sr-refresh text-sm ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(post => (
            <div key={post._id} className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {post.studentName || 'Anonymous'}
                </span>
                <div className="flex items-center gap-2">
                  {isOwnPost(post._id) && !editingPostId && (
                    <button
                      onClick={() => handleEditClick(post)}
                      className="p-1 text-zinc-400 hover:text-blue-500 transition-colors"
                      title="Edit"
                    >
                      <i className="fi fi-sr-pencil text-xs" />
                    </button>
                  )}
                  <span className="text-[10px] text-zinc-400">
                    {new Date(post.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              {editingPostId === post._id ? (
                <div className="space-y-2">
                  <textarea
                    value={editMessage}
                    onChange={e => setEditMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 text-sm resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditCancel}
                      className="flex-1 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditSave(post._id)}
                      disabled={editSaving || !editMessage.trim()}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      {editSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{post.content?.message}</p>
              )}
            </div>
          ))}
          </div>
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}