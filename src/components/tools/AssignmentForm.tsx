'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';

interface AssignmentFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

const PREVIEWABLE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown', 'application/json', 'text/javascript', 'text/css', 'text/html', 'application/x-javascript'];
const PREVIEWABLE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.md', '.json', '.js', '.css', '.html', '.py', '.ts', '.tsx'];

function canPreview(fileUrl: string | null): boolean {
  if (!fileUrl) return false;
  const ext = fileUrl.toLowerCase().slice(fileUrl.lastIndexOf('.'));
  return PREVIEWABLE_EXTS.includes(ext) || PREVIEWABLE_TYPES.some(t => fileUrl.includes(t));
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
  const [showPreview, setShowPreview] = useState(false);
  const [removeFile, setRemoveFile] = useState(false);

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
        let updatedFileUrl: string | null = null;
        let newFile: File | null = null;
        
        if (file && file.size > 0) {
          newFile = file;
        } else if (removeFile && fileUrl) {
          updatedFileUrl = null;
        }
        
        const formData = new FormData();
        formData.set('responseId', responseId);
        formData.set('editToken', editToken);
        formData.set('content', JSON.stringify({ answer: answer.trim() }));
        if (newFile) {
          formData.set('file', newFile);
          formData.set('action', 'replace');
        } else if (removeFile) {
          formData.set('action', 'remove');
        }
        
        const res = await fetch('/api/tools/edit', {
          method: 'PATCH',
          headers: { 
            'student-token': getStudentToken(),
          },
          body: formData,
        });
        const contentType = res.headers.get('content-type');
        let data;
        if (contentType?.includes('application/json')) {
          data = await res.json();
        } else {
          data = { error: t('serverError') };
        }
        
        if (data.error) {
          setError(data.error);
        } else {
          setIsEditing(false);
          setRemoveFile(false);
          const newFileUrl = newFile ? data.fileUrl : (removeFile ? null : fileUrl);
          setFileUrl(newFileUrl);
          setFile(null);
          setFileName('');
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
                ...parsed, 
                content: { answer: answer.trim() },
                fileUrl: newFileUrl,
              }));
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
          headers: { 'student-token': getStudentToken() },
          body: formData,
        });

        const contentType = res.headers.get('content-type');
        let data;
        if (contentType?.includes('application/json')) {
          data = await res.json();
        } else {
          data = { error: t('serverError') };
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
      setError(t('failedToSubmit'));
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
              {t('submitted')}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('name')}</label>
              <p className="text-zinc-900 dark:text-zinc-100 font-medium">{studentName || t('anonymous')}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('answer')}</label>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-slate-900 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {answer}
              </div>
            </div>

            {fileUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('file')}</label>
                <div className="flex flex-wrap gap-2">
                  {canPreview(fileUrl) && (
                    <button
                      type="button"
                      onClick={() => setShowPreview(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                    >
                      <i className="fi fi-sr-eye" />
                      Preview
                    </button>
                  )}
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-slate-600 transition-colors text-sm"
                  >
                    <i className="fi fi-sr-download" />
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <i className="fi fi-sr-pencil mr-2" />
            {t('editMyAnswer')}
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
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{session.config?.prompt || t('submitYourAssignment')}</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                required
                placeholder={t('yourFullName')}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('answer')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                required
                rows={6}
                placeholder={t('typeYourAnswerHere')}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>

            {allowFileUpload && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('fileUploadOptional')}
                </label>
                {(fileUrl && !isEditing) && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <i className="fi fi-sr-check-circle text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">File attached</span>
                  </div>
                )}
                {(fileUrl && isEditing) && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <i className="fi fi-sr-file text-zinc-500" />
                      <span className="text-sm text-zinc-600 dark:text-zinc-300 truncate max-w-[200px]">
                        {fileUrl.split('/').pop()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {canPreview(fileUrl) && (
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          Preview
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setRemoveFile(true); setFileUrl(null); }}
                        className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                {(!fileUrl || isEditing) && (
                  <label className="flex items-center gap-3 w-full px-4 py-5 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-zinc-300 dark:border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
                    <i className="fi fi-sr-cloud-upload text-xl text-zinc-400" />
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                      {fileName || (removeFile ? 'File will be removed' : t('clickToUploadFile'))}
                    </span>
                    <input
                      type="file"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setFile(f);
                          setFileName(f.name);
                          setRemoveFile(false);
                        }
                      }}
                      className="sr-only"
                    />
                  </label>
                )}
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
                {t('cancel')}
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || !answer.trim()}
              className={`py-3 ${isEditing ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50`}
            >
              {submitting ? t('saving') : isEditing ? t('saveChanges') : t('submitAssignment')}
            </button>
          </div>
        </form>
      </div>
    </div>

    {showPreview && fileUrl && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={() => setShowPreview(false)}
      >
        <div 
          className="relative max-w-4xl max-h-[90vh] w-full mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-slate-700">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">File Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-500 transition-colors"
            >
              <i className="fi fi-sr-times text-xl" />
            </button>
          </div>
          <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
            {fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={fileUrl} alt="Preview" className="max-w-full h-auto rounded-lg" />
            ) : fileUrl.match(/\.pdf$/i) ? (
              <iframe src={fileUrl} className="w-full h-[70vh] rounded-lg" title="PDF Preview" />
            ) : (
              <pre className="p-4 bg-zinc-100 dark:bg-slate-900 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 overflow-auto max-h-[70vh] whitespace-pre-wrap font-mono">
                {typeof window !== 'undefined' && fetch(fileUrl).then(r => r.text()).catch(() => 'Unable to load file content')}
              </pre>
            )}
          </div>
        </div>
      </div>
    )}
  );
}