'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';

interface DiscussionForumProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

interface Reply {
  _id: string;
  studentName?: string;
  content: { reply?: string };
  createdAt: string;
}

interface OwnReply {
  _id: string;
  editToken: string;
}

export default function DiscussionForum({ session }: DiscussionForumProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reply, setReply] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownReplies, setOwnReplies] = useState<OwnReply[]>([]);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReply, setEditReply] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const STORAGE_KEY = `discussion_${session._id}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setOwnReplies(JSON.parse(stored));
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [session._id]);

  const isOwnReply = (replyId: string) => ownReplies.some(r => r._id === replyId);
  const getOwnToken = (replyId: string) => ownReplies.find(r => r._id === replyId)?.editToken;

  const fetchReplies = async () => {
    try {
      const res = await fetch(`/api/tools/poll?sessionId=${session._id}`);
      const data = await res.json();
      if (data.responses) {
        setReplies(data.responses);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReplies();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReplies();
    const interval = setInterval(fetchReplies, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session._id]);

  const handleSubmit = async () => {
    if (!reply.trim()) return;
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
          studentName: name.trim() || undefined,
          content: { reply: reply.trim() },
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setReply('');
        fetchReplies();
        if (data.id && data.editToken && typeof window !== 'undefined') {
          const newOwnReply = { _id: data.id, editToken: data.editToken };
          const updatedOwnReplies = [...ownReplies, newOwnReply];
          setOwnReplies(updatedOwnReplies);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOwnReplies));
        }
      }
    } catch {
      setError(t('failedToSubmitSimple'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (r: Reply) => {
    setEditingReplyId(r._id);
    setEditReply(r.content?.reply || '');
  };

  const handleEditCancel = () => {
    setEditingReplyId(null);
    setEditReply('');
  };

  const handleEditSave = async (replyId: string) => {
    if (!editReply.trim()) return;
    const token = getOwnToken(replyId);
    if (!token) return;

    setEditSaving(true);
    try {
      const res = await fetch('/api/tools/edit', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'student-token': getStudentToken(),
        },
        body: JSON.stringify({
          responseId: replyId,
          editToken: token,
          content: { reply: editReply.trim() },
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setEditingReplyId(null);
        setEditReply('');
        fetchReplies();
      }
    } catch {
      setError(t('failedToSave'));
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-4 gap-4">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
      </div>

      <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
        <h2 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          {session.config?.prompt || t('discussionTopic')}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t('shareRespectful')}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-3">
        <input
          type="text"
          placeholder={t('yourNameOptional')}
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder={t('shareThoughts')}
          value={reply}
          onChange={e => setReply(e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting || !reply.trim()}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          {submitting ? t('posting') : t('postReply')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">{t('loading')}</div>
      ) : (
        <div className="space-y-3 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">
              {replies.length} {replies.length === 1 ? t('reply') : t('replies')}
            </h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 transition-colors disabled:opacity-50"
              title={t('refresh')}
            >
              <i className={`fi fi-sr-refresh text-sm ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {replies.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">{t('noRepliesYet')}</div>
          ) : (
            <div className="space-y-3">
              {replies.map(r => (
                <div key={r._id} className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {r.studentName || t('anonymous')}
                    </span>
                    <div className="flex items-center gap-2">
                      {isOwnReply(r._id) && !editingReplyId && (
                        <button
                          onClick={() => handleEditClick(r)}
                          className="p-1 text-zinc-400 hover:text-blue-500 transition-colors"
                          title={t('edit')}
                        >
                          <i className="fi fi-sr-pencil text-xs" />
                        </button>
                      )}
                      <span className="text-[10px] text-zinc-400">
                        {new Date(r.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {editingReplyId === r._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editReply}
                        onChange={e => setEditReply(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 text-sm resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleEditCancel}
                          className="flex-1 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          onClick={() => handleEditSave(r._id)}
                          disabled={editSaving || !editReply.trim()}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                        >
                          {editSaving ? t('saving') : t('save')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 break-words">{r.content?.reply}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}