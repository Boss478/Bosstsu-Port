'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { quickStartSession } from '@/app/admin/tools/actions';

const TOOL_TYPES = [
  { value: 'padlet', label: 'Padlet (Idea Board)', desc: 'Collect ideas on a digital board', icon: 'fi-sr-grid' },
  { value: 'poll', label: 'Poll (Mentimeter)', desc: 'MCQ or word cloud voting', icon: 'fi-sr-chart-pie' },
  { value: 'assignment', label: 'Assignment', desc: 'Text answers + optional file upload', icon: 'fi-sr-file-upload' },
  { value: 'qa_board', label: 'Q&A Board', desc: 'Anonymous question board with voting', icon: 'fi-sr-interrogation' },
  { value: 'quiz', label: 'Quick Quiz', desc: 'Multiple choice quiz with scoring', icon: 'fi-sr-graduation-cap' },
  { value: 'exit_ticket', label: 'Exit Ticket', desc: '3-field reflection form', icon: 'fi-sr-ticket' },
  { value: 'discussion', label: 'Discussion Forum', desc: 'Threaded conversation board', icon: 'fi-sr-comments' },
];

export default function QuickStartModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [allowFileUpload, setAllowFileUpload] = useState(false);
  const [pollMode, setPollMode] = useState<'mcq' | 'wordcloud'>('mcq');
  const [allowCustomChoices, setAllowCustomChoices] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleOpen = () => {
    setOpen(true);
    setStep('type');
    setSelectedType('');
    setTitle('');
    setPrompt('');
    setAllowFileUpload(false);
    setPollMode('mcq');
    setAllowCustomChoices(false);
    setPollOptions(['', '']);
    setError(null);
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep('config');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set('type', selectedType);
    formData.set('title', title.trim());
    if (prompt.trim()) formData.set('prompt', prompt.trim());
    if (allowFileUpload) formData.set('allowFileUpload', 'on');
    if (pollMode) formData.set('pollMode', pollMode);
    if (allowCustomChoices) formData.set('allowCustomChoices', 'on');
    if (pollMode === 'mcq' && selectedType === 'poll') {
      const hasCustomOptions = pollOptions.some(o => o.trim());
      if (hasCustomOptions) {
        formData.set('questions', JSON.stringify([{ options: pollOptions }]));
      }
    }
    const result = await quickStartSession(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      if (result.sessionId) {
        router.push(`/admin/tools/sessions/${result.sessionId}`);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
      >
        <i className="fi fi-sr-plus text-sm" />
        Start New Session
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/10" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200/60 dark:border-slate-700/50">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {step === 'type' ? 'Select Tool Type' : 'Configure Session'}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors"
              >
                <i className="fi fi-sr-cross text-lg" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {step === 'type' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TOOL_TYPES.map(tool => (
                    <button
                      key={tool.value}
                      onClick={() => handleTypeSelect(tool.value)}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-slate-700 text-left hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <i className={`fi ${tool.icon} text-blue-500 dark:text-blue-400 text-lg`} />
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{tool.label}</span>
                      </div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 pl-8">{tool.desc}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
                    <i className="fi fi-sr-info-circle mr-1" />
                    {TOOL_TYPES.find(t => t.value === selectedType)?.label}
                  </div>

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

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Prompt / Instructions
                    </label>
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder={selectedType === 'padlet' ? 'Share your ideas about...' : selectedType === 'poll' ? 'Vote for the best option!' : 'Enter any instructions for students...'}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {selectedType === 'poll' && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Poll Mode</label>
                      <div className="flex gap-3">
                        {(['mcq', 'wordcloud'] as const).map(mode => (
                          <label
                            key={mode}
                            className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                              pollMode === mode
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-zinc-200 dark:border-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="pollMode"
                              value={mode}
                              checked={pollMode === mode}
                              onChange={() => setPollMode(mode)}
                              className="accent-blue-500"
                            />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">{mode}</span>
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

                  {selectedType === 'assignment' && (
                    <div className="flex items-center gap-2">
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
                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-5 border-t border-zinc-200/60 dark:border-slate-700/50">
              {step === 'config' ? (
                <>
                  <button
                    onClick={() => setStep('type')}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    <i className="fi fi-sr-arrow-left mr-1" />
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={pending || !title.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    <i className="fi fi-sr-play text-sm" />
                    {pending ? 'Starting...' : 'Start Session'}
                  </button>
                </>
              ) : (
                <div className="w-full text-center">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-6 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}