'use client';

import { useState, useEffect } from 'react';

interface AssignmentFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function AssignmentForm({ session }: AssignmentFormProps) {
  const [studentName, setStudentName] = useState('');
  const [answer, setAnswer] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [editToken, setEditToken] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const STORAGE_KEY = `assignment_${session._id}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setResponseId(data.responseId);
          setEditToken(data.editToken);
          setStudentName(data.studentName || '');
          setAnswer(data.content?.answer || '');
          setFileUrl(data.fileUrl || null);
          setSubmitted(true);
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [session._id]);

  useEffect(() => {
    if (!submitted && !isEditing) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [submitted, isEditing]);

  const allowFileUpload = session.config?.allowFileUpload !== false;

  const handleSubmit = async (e: React.FormEvent, isEdit = false) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && responseId && editToken) {
        const res = await fetch('/api/tools/edit', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responseId,
            editToken,
            content: { answer: answer.trim() },
          }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setIsEditing(false);
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, content: { answer: answer.trim() } }));
            }
          }
        }
      } else {
        const formData = new FormData();
        formData.set('sessionId', session._id);
        formData.set('studentName', studentName);
        formData.set('content', JSON.stringify({ answer: answer.trim() }));
        if (file) formData.set('file', file);

        const res = await fetch('/api/tools/respond', {
          method: 'POST',
          body: formData,
        });

        const contentType = res.headers.get('content-type');
        let data;
        if (contentType?.includes('application/json')) {
          data = await res.json();
        } else {
          data = { error: 'Server error' };
        }

        if (data.error) {
          setError(data.error);
        } else {
          setSubmitted(true);
          setResponseId(data.id);
          setEditToken(data.editToken);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              responseId: data.id,
              editToken: data.editToken,
              studentName,
              content: { answer: answer.trim() },
              fileUrl: null,
            }));
          }
        }
      }
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && !isEditing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-mono">
              <i className="fi fi-sr-check-circle" />
              Submitted
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
              <p className="text-zinc-900 dark:text-zinc-100 font-medium">{studentName || 'Anonymous'}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Answer</label>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-slate-900 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {answer}
              </div>
            </div>

            {fileUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">File</label>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                  <i className="fi fi-sr-file" />
                  Download attached file
                </a>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <i className="fi fi-sr-pencil mr-2" />
            Edit My Answer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-mono">
            <i className="fi fi-sr-file-upload" />
            {session.sessionCode}
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, isEditing)} className="space-y-4">
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{session.config?.prompt || 'Submit your assignment'}</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                required
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Answer <span className="text-red-500">*</span>
              </label>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                required
                rows={6}
                placeholder="Type your answer here..."
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>

            {allowFileUpload && !isEditing && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  File Upload (optional, max 10MB)
                </label>
                <label className="flex items-center gap-3 w-full px-4 py-5 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-zinc-300 dark:border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
                  <i className="fi fi-sr-cloud-upload text-xl text-zinc-400" />
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    {fileName || 'Click to upload a file'}
                  </span>
                  <input
                    type="file"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFile(f);
                        setFileName(f.name);
                      }
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={() => { setIsEditing(false); setError(null); }}
                className="flex-1 py-3 bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || !answer.trim()}
              className={`py-3 ${isEditing ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50`}
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Submit Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}