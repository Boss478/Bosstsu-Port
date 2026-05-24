'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addStage, editStage, deleteStage } from '@/app/admin/tools/actions';
import { type StepConfig } from '@/components/admin/QuickStartModal';

const TOOL_TYPES = [
  { value: 'padlet', label: 'Padlet (Idea Board)', icon: 'fi-sr-grid' },
  { value: 'poll', label: 'Poll (Mentimeter)', icon: 'fi-sr-chart-pie' },
  { value: 'assignment', label: 'Assignment', icon: 'fi-sr-file-upload' },
  { value: 'qa_board', label: 'Q&A Board', icon: 'fi-sr-interrogation' },
  { value: 'quiz', label: 'Quick Quiz', icon: 'fi-sr-graduation-cap' },
  { value: 'exit_ticket', label: 'Exit Ticket', icon: 'fi-sr-ticket' },
];

const NAMED_TOOL_TYPES = ['padlet', 'assignment', 'exit_ticket'];

interface StageManagerModalProps {
  sessionId: string;
  steps: Array<{
    type: string;
    title: string;
    config?: Record<string, unknown>;
  }>;
  currentStep: number;
  onSuccess: () => void;
  onClose: () => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

type ViewState = 'list' | 'config' | 'delete-confirm';

export default function StageManagerModal({
  sessionId,
  steps: initialSteps,
  currentStep: initialCurrentStep,
  onSuccess,
  onClose,
}: StageManagerModalProps) {
  const router = useRouter();

  const [view, setView] = useState<ViewState>('list');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [selectedType, setSelectedType] = useState('');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [allowFileUpload, setAllowFileUpload] = useState(false);
  const [pollMode, setPollMode] = useState<'mcq' | 'wordcloud'>('mcq');
  const [allowCustomChoices, setAllowCustomChoices] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingIndex, setDeletingIndex] = useState(-1);

  const isAdding = editingIndex === -1;

  const buildStepConfig = (): Record<string, unknown> => {
    const config: Record<string, unknown> = {};
    if (prompt) config.prompt = prompt;
    if (allowFileUpload) config.allowFileUpload = true;
    if (selectedType === 'poll') {
      config.pollMode = pollMode;
      if (allowCustomChoices) config.allowCustomChoices = true;
      const filledOptions = pollOptions.filter(o => o.trim() !== '');
      if (filledOptions.length >= 2) {
        config.questions = filledOptions.map(text => ({ options: [text] }));
      }
    }
    if (selectedType === 'quiz' && quizQuestions.length > 0) {
      config.questions = quizQuestions
        .filter(q => q.question.trim() !== '')
        .map(q => ({
          question: q.question,
          options: q.options.filter(o => o.trim() !== ''),
          correctAnswer: q.correctAnswer,
        }));
    }
    return config;
  };

  const loadStepIntoForm = (index: number) => {
    const step = initialSteps[index];
    if (!step) return;

    setEditingIndex(index);
    setSelectedType(step.type);
    setTitle(step.title || '');
    setError(null);

    const cfg = step.config || {};
    setPrompt((cfg.prompt as string) || '');
    setAllowFileUpload((cfg.allowFileUpload as boolean) || false);
    setPollMode((cfg.pollMode as 'mcq' | 'wordcloud') || 'mcq');
    setAllowCustomChoices((cfg.allowCustomChoices as boolean) || false);

    const questions = cfg.questions as Array<{ question?: string; options?: string[]; correctAnswer?: number }> | undefined;
    if (step.type === 'poll' && questions && questions.length > 0) {
      const options = questions.map(q => q.options?.[0] || '');
      while (options.length < 2) options.push('');
      setPollOptions(options);
    } else {
      setPollOptions(['', '']);
    }

    if (step.type === 'quiz' && questions) {
      setQuizQuestions(
        questions.map(q => ({
          question: q.question || '',
          options: q.options && q.options.length >= 2 ? [...q.options] : ['', ''],
          correctAnswer: q.correctAnswer ?? -1,
        }))
      );
    } else {
      setQuizQuestions([]);
    }

    setView('config');
  };

  const handleAddNew = () => {
    setEditingIndex(-1);
    setSelectedType('');
    setTitle('');
    setPrompt('');
    setAllowFileUpload(false);
    setPollMode('mcq');
    setAllowCustomChoices(false);
    setPollOptions(['', '']);
    setQuizQuestions([]);
    setError(null);
    setView('config');
  };

  const handleSubmitAdd = async () => {
    if (!selectedType || !title.trim()) {
      setError('กรุณาเลือกประเภทและระบุชื่อ');
      return;
    }

    setPending(true);
    setError(null);

    const fd = new FormData();
    fd.set('type', selectedType);
    fd.set('title', title.trim());
    fd.set('config', JSON.stringify(buildStepConfig()));
    fd.set('position', String(initialSteps.length));

    const result = await addStage(sessionId, fd);
    if (result?.error) {
      setError(result.error as string);
      setPending(false);
      return;
    }

    setPending(false);
    onSuccess();
  };

  const handleSubmitEdit = async () => {
    if (!title.trim()) {
      setError('กรุณาระบุชื่อ');
      return;
    }

    setPending(true);
    setError(null);

    const fd = new FormData();
    fd.set('index', String(editingIndex));
    fd.set('type', selectedType);
    fd.set('title', title.trim());
    fd.set('config', JSON.stringify(buildStepConfig()));

    const result = await editStage(sessionId, fd);
    if (result?.error) {
      setError(result.error as string);
      setPending(false);
      return;
    }

    setPending(false);
    onSuccess();
  };

  const handleConfirmDelete = async () => {
    setPending(true);

    const fd = new FormData();
    fd.set('index', String(deletingIndex));

    const result = await deleteStage(sessionId, fd);
    if (result?.error) {
      setError(result.error as string);
      setPending(false);
      return;
    }

    setPending(false);
    setDeletingIndex(-1);
    onSuccess();
  };

  const handleBackToList = () => {
    setView('list');
    setEditingIndex(-1);
    setError(null);
  };

  if (view === 'delete-confirm') {
    const deletingStep = initialSteps[deletingIndex];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
        <div
          className="w-full max-w-md rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <i className="fi fi-sr-exclamation text-red-500 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Delete Stage</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6">
              Are you sure you want to delete stage <span className="font-semibold">{deletingStep?.title}</span>?
              Student responses for this stage will remain but won&apos;t be linked to any active stage.
            </p>

            {error && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setView('list'); setDeletingIndex(-1); setError(null); }}
                disabled={pending}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={pending}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {pending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'config') {
    const showTypeSelection = isAdding && !selectedType;

    if (showTypeSelection) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div
            className="w-full max-w-2xl rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Select Stage Type</h3>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <i className="fi fi-sr-cross text-lg" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOOL_TYPES.map(tool => (
                  <button
                    key={tool.value}
                    onClick={() => setSelectedType(tool.value)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                  >
                    <i className={`fi ${tool.icon} text-blue-500 text-lg shrink-0`} />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{tool.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-slate-700">
                <button
                  onClick={handleBackToList}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
        <div
          className="w-full max-w-2xl rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {isAdding ? 'Add Stage' : `Edit Stage ${editingIndex + 1}`}
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <i className="fi fi-sr-cross text-lg" />
              </button>
            </div>

            {isAdding && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Type</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <i className={`fi ${TOOL_TYPES.find(t => t.value === selectedType)?.icon} text-blue-500`} />
                  {TOOL_TYPES.find(t => t.value === selectedType)?.label}
                  <button
                    onClick={() => setSelectedType('')}
                    className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Change
                  </button>
                </p>
              </div>
            )}

            {!isAdding && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Type</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <i className={`fi ${TOOL_TYPES.find(t => t.value === selectedType)?.icon} text-blue-500`} />
                  {TOOL_TYPES.find(t => t.value === selectedType)?.label}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Week 5 Brainstorm"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Prompt / Instructions
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={
                  selectedType === 'padlet' ? 'Share your ideas about...'
                  : selectedType === 'poll' ? 'Vote for the best option!'
                  : 'Enter any instructions for students...'
                }
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {selectedType === 'poll' && (
              <div className="space-y-2 mt-4">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Poll Mode</label>
                <div className="flex gap-3">
                  {(['mcq', 'wordcloud'] as const).map(m => (
                    <label
                      key={m}
                      className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        pollMode === m
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zinc-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pollMode"
                        value={m}
                        checked={pollMode === m}
                        onChange={() => setPollMode(m)}
                        className="accent-blue-500"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">{m}</span>
                    </label>
                  ))}
                </div>
                {pollMode === 'mcq' && (
                  <>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="allowCustomChoices"
                        checked={allowCustomChoices}
                        onChange={e => setAllowCustomChoices(e.target.checked)}
                        className="accent-blue-500 w-4 h-4"
                      />
                      <label htmlFor="allowCustomChoices" className="text-sm text-zinc-700 dark:text-zinc-300">
                        Allow students to add custom choices
                      </label>
                    </div>
                    <div className="space-y-2 mt-3">
                      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Poll Options
                      </label>
                      <div className="space-y-2">
                        {pollOptions.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400 w-16 shrink-0">
                              Option {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={e => {
                                const newOpts = [...pollOptions];
                                newOpts[idx] = e.target.value;
                                setPollOptions(newOpts);
                              }}
                              placeholder={idx < 2 ? `Default: Option ${idx + 1}` : `Option ${idx + 1}`}
                              className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {idx >= 2 && (
                              <button
                                type="button"
                                onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <i className="fi fi-sr-cross text-sm" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, ''])}
                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <i className="fi fi-sr-plus text-xs" />
                        Add Option
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {selectedType === 'quiz' && (
              <div className="space-y-3 mt-4">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Quiz Questions</label>
                <div className="space-y-3">
                  {quizQuestions.map((q, qi) => (
                    <div key={qi} className="p-3 rounded-xl bg-zinc-50 dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">Q{qi + 1}</span>
                        <input
                          type="text"
                          value={q.question}
                          onChange={e => {
                            const copy = [...quizQuestions];
                            copy[qi] = { ...copy[qi], question: e.target.value };
                            setQuizQuestions(copy);
                          }}
                          placeholder="e.g. What is 2+2?"
                          className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qi))}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <i className="fi fi-sr-cross text-sm" />
                        </button>
                      </div>
                      <div className="pl-4 space-y-1.5">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`correct_${qi}`}
                                checked={q.correctAnswer === oi}
                                onChange={() => {
                                  const copy = [...quizQuestions];
                                  copy[qi] = { ...copy[qi], correctAnswer: oi };
                                  setQuizQuestions(copy);
                                }}
                                className="accent-blue-500 w-3.5 h-3.5"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={e => {
                                  const copy = [...quizQuestions];
                                  const newOpts = [...copy[qi].options];
                                  newOpts[oi] = e.target.value;
                                  copy[qi] = { ...copy[qi], options: newOpts };
                                  setQuizQuestions(copy);
                                }}
                                placeholder={`Option ${oi + 1}`}
                                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                              />
                              {oi >= 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = [...quizQuestions];
                                    copy[qi] = { ...copy[qi], options: copy[qi].options.filter((_, i) => i !== oi) };
                                    if (copy[qi].correctAnswer === oi) copy[qi].correctAnswer = -1;
                                    else if (copy[qi].correctAnswer > oi) copy[qi].correctAnswer--;
                                    setQuizQuestions(copy);
                                  }}
                                  className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                  <i className="fi fi-sr-cross text-xs" />
                                </button>
                              )}
                            </label>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...quizQuestions];
                            copy[qi] = { ...copy[qi], options: [...copy[qi].options, ''] };
                            setQuizQuestions(copy);
                          }}
                          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors ml-7"
                        >
                          <i className="fi fi-sr-plus text-xs" />
                          Add Option
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setQuizQuestions([...quizQuestions, { question: '', options: ['', ''], correctAnswer: -1 }])}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <i className="fi fi-sr-plus text-xs" />
                  Add Question
                </button>
              </div>
            )}

            {selectedType === 'assignment' && (
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="allowFileUpload"
                  checked={allowFileUpload}
                  onChange={e => setAllowFileUpload(e.target.checked)}
                  className="accent-blue-500 w-4 h-4"
                />
                <label htmlFor="allowFileUpload" className="text-sm text-zinc-700 dark:text-zinc-300">
                  Allow file upload
                </label>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 mt-4">{error}</p>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200 dark:border-slate-700">
              <button
                onClick={handleBackToList}
                disabled={pending}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={isAdding ? handleSubmitAdd : handleSubmitEdit}
                disabled={pending}
                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {pending && <i className="fi fi-sr-spinner animate-spin text-sm" />}
                {isAdding ? 'Add Stage' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Manage Stages</h3>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <i className="fi fi-sr-cross text-lg" />
            </button>
          </div>

          {initialSteps.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">No stages yet. Add one to get started.</p>
          ) : (
            <div className="space-y-2">
              {initialSteps.map((step, idx) => {
                const toolInfo = TOOL_TYPES.find(t => t.value === step.type);
                const isActive = idx === initialCurrentStep;
                const isPast = idx < initialCurrentStep;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : isPast
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                          : 'border-zinc-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isPast
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-200 dark:bg-slate-600 text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {step.title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        {toolInfo && <i className={`fi ${toolInfo.icon} text-xs`} />}
                        {toolInfo?.label || step.type}
                        {isActive && <span className="text-blue-600 dark:text-blue-400 font-semibold ml-1">(Active)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => loadStepIntoForm(idx)}
                        className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit stage"
                      >
                        <i className="fi fi-sr-pencil text-sm" />
                      </button>
                      <button
                        onClick={() => { setDeletingIndex(idx); setView('delete-confirm'); }}
                        className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete stage"
                      >
                        <i className="fi fi-sr-trash text-sm" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 mt-4">{error}</p>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200 dark:border-slate-700">
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <i className="fi fi-sr-plus text-sm" />
              Add Stage
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
