'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';

interface AssignmentFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  stepIndex?: number;
  studentName?: string;
}

export default function AssignmentForm({ session, stepIndex, studentName: propName }: AssignmentFormProps) {
  const [studentName, setStudentName] = useState(propName || '');
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
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [removeCurrentFile, setRemoveCurrentFile] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileType, setPreviewFileType] = useState<'image' | 'pdf' | 'other' | null>(null);

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
          setExistingFileUrl(data.fileUrl || null);
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

  const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const handlePreviewFile = (url: string) => {
    setPreviewFileType(getFileType(url));
    setPreviewFileUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent, isEdit = false) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && responseId && editToken) {
        const editFormData = new FormData();
        editFormData.set('responseId', responseId);
        editFormData.set('editToken', editToken);
        editFormData.set('content', JSON.stringify({ answer: answer.trim() }));
        
        if (removeCurrentFile && file) {
          editFormData.set('action', 'replace');
          editFormData.set('file', file);
        } else if (removeCurrentFile) {
          editFormData.set('action', 'remove');
        } else if (file) {
          editFormData.set('action', 'replace');
          editFormData.set('file', file);
        }
        
        const res = await fetch('/api/tools/edit', {
          method: 'PATCH',
          headers: {
            'student-token': getStudentToken(),
          },
          body: editFormData,
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setIsEditing(false);
          setRemoveCurrentFile(false);
          setFileUrl(data.fileUrl || null);
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
                ...parsed, 
                content: { answer: answer.trim() },
                fileUrl: data.fileUrl || null,
              }));
            }
          }
        }
      } else {
        const formData = new FormData();
        formData.set('sessionId', session._id);
        formData.set('studentName', studentName);
        formData.set('content', JSON.stringify({ answer: answer.trim() }));
        if (stepIndex !== undefined) formData.set('stepIndex', String(stepIndex));
        if (file) formData.set('file', file);

        const res = await fetch('/api/tools/respond', {
          method: 'POST',
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
          setSubmitted(true);
          setResponseId(data.id);
          setEditToken(data.editToken);
          setFileUrl(data.fileUrl || null);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              responseId: data.id,
              editToken: data.editToken,
              studentName,
              content: { answer: answer.trim() },
              fileUrl: data.fileUrl || null,
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
                <button
                  onClick={() => handlePreviewFile(fileUrl)}
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <i className="fi fi-sr-eye" />
                  {t('previewFile')}
                </button>
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

        {previewFileUrl && (
          <div 
            className="fixed inset-0 z-150 flex items-center justify-center bg-black/10 p-4 animate-fade-in-up"
            onClick={() => setPreviewFileUrl(null)}
          >
            <button 
              type="button"
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 flex items-center justify-center transition-all z-10"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewFileUrl(null);
              }}
            >
              <i className="fi fi-sr-cross text-xl flex" />
            </button>
            <div 
              className="relative w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {previewFileType === 'image' && (
                <img
                  src={previewFileUrl}
                  alt="File Preview"
                  className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
                />
              )}
              {previewFileType === 'pdf' && (
                <iframe
                  src={previewFileUrl}
                  className="w-full h-full rounded-lg bg-white"
                  title="PDF Preview"
                />
              )}
              {previewFileType === 'other' && (
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg">
                  <i className="fi fi-sr-file text-6xl text-zinc-300 dark:text-zinc-600 mb-4 block" />
                  <p className="text-zinc-500 dark:text-zinc-400">{t('noPreviewAvailable')}</p>
                </div>
              )}
            </div>
          </div>
        )}
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
              {!propName && (
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                required
                placeholder={t('yourFullName')}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              )}
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
                {isEditing && existingFileUrl && !removeCurrentFile ? (
                  <>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t('currentFile')}
                    </label>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-slate-900 border border-zinc-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <i className="fi fi-sr-file text-xl text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                          {existingFileUrl.split('/').pop()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <label className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                          {fileName || t('replaceFile')}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf,image/gif,image/webp,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                        <button
                          type="button"
                          onClick={() => { setRemoveCurrentFile(true); setFile(null); setFileName(''); }}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        >
                          {t('removeFile')}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  !isEditing && (
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t('fileUploadOptional')}
                    </label>
                  )
                )}
                {(!isEditing || !existingFileUrl || removeCurrentFile) && (
                  <label className="flex items-center gap-3 w-full px-4 py-5 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-zinc-300 dark:border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
                    <i className="fi fi-sr-cloud-upload text-xl text-zinc-400" />
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                      {fileName || t('clickToUploadFile')}
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

        {previewFileUrl && (
          <div 
            className="fixed inset-0 z-150 flex items-center justify-center bg-black/10 p-4 animate-fade-in-up"
            onClick={() => setPreviewFileUrl(null)}
          >
            <button 
              type="button"
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 flex items-center justify-center transition-all z-10"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewFileUrl(null);
              }}
            >
              <i className="fi fi-sr-cross text-xl flex" />
            </button>
            <div 
              className="relative w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {previewFileType === 'image' && (
                <img
                  src={previewFileUrl}
                  alt="File Preview"
                  className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
                />
              )}
              {previewFileType === 'pdf' && (
                <iframe
                  src={previewFileUrl}
                  className="w-full h-full rounded-lg bg-white"
                  title="PDF Preview"
                />
              )}
              {previewFileType === 'other' && (
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg">
                  <i className="fi fi-sr-file text-6xl text-zinc-300 dark:text-zinc-600 mb-4 block" />
                  <p className="text-zinc-500 dark:text-zinc-400">{t('noPreviewAvailable')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}