'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quickStartSession, saveTemplate, getTemplates } from '@/app/admin/tools/actions';
import { t } from '@/lib/tool-translations';

const TOOL_TYPES = [
  { value: 'padlet', label: 'Padlet (Idea Board)', desc: 'Collect ideas on a digital board · Brainstorming, sharing work, visual collaboration', icon: 'fi-sr-grid', helpTh: 'นักเรียนโพสต์ไอเดีย รูปภาพ หรือลิงก์บนบอร์ดดิจิทัลร่วมกัน', helpEn: 'Students post ideas, images, or links on a shared digital board.', usageTh: 'เหมาะสำหรับ: ระดมสมอง, แชร์ผลงาน, Brainstorming', usageEn: 'Best for: Brainstorming, sharing work, visual collaboration' },
  { value: 'poll', label: 'Poll (Mentimeter)', desc: 'MCQ or word cloud voting · Opinion polls, understanding checks, quick feedback', icon: 'fi-sr-chart-pie', helpTh: 'สร้างคำถามแบบเลือกตอบหรือ Word Cloud นักเรียนโหวตและเห็นผลลัพธ์แบบเรียลไทม์', helpEn: 'Create MCQ or word cloud polls. Students vote and see live results.', usageTh: 'เหมาะสำหรับ: สำรวจความคิดเห็น, เช็คความเข้าใจ, Quick feedback', usageEn: 'Best for: Opinion polls, understanding checks, quick feedback' },
  { value: 'assignment', label: 'Assignment', desc: 'Text answers + file upload · Homework, project submissions, work requiring file attachments', icon: 'fi-sr-file-upload', helpTh: 'นักเรียนส่งคำตอบเป็นข้อความและอัปโหลดไฟล์ (PDF, รูปภาพ) ได้', helpEn: 'Students submit text answers and optionally upload files (PDF, images).', usageTh: 'เหมาะสำหรับ: การบ้าน, ส่งโปรเจกต์, งานที่ต้องมีไฟล์ประกอบ', usageEn: 'Best for: Homework, project submissions, work requiring file attachments' },
  { value: 'qa_board', label: 'Q&A Board', desc: 'Anonymous Q&A with voting · Post-lesson Q&A, identifying common confusions', icon: 'fi-sr-interrogation', helpTh: 'นักเรียนตั้งคำถามแบบไม่ระบุตัวตน โหวตคำถามที่อยากได้คำตอบมากที่สุด', helpEn: 'Students ask questions anonymously. Vote on questions they want answered most.', usageTh: 'เหมาะสำหรับ: ถาม-ตอบหลังเรียน, ระบุจุดที่สับสนร่วมกัน', usageEn: 'Best for: Post-lesson Q&A, identifying common confusions' },
  { value: 'quiz', label: 'Quick Quiz', desc: 'Multiple choice quiz with scoring · Comprehension tests, formative assessment', icon: 'fi-sr-graduation-cap', helpTh: 'สร้างควิซแบบเลือกตอบหลายข้อ นักเรียนได้คะแนนและฟีดแบ็กทันที', helpEn: 'Create multi-question MCQ quizzes. Students get instant scores and feedback.', usageTh: 'เหมาะสำหรับ: ทดสอบความเข้าใจ, ประเมินผลระหว่างเรียน', usageEn: 'Best for: Comprehension tests, formative assessment' },
  { value: 'exit_ticket', label: 'Exit Ticket', desc: '3-field reflection form · Lesson wrap-up, end-of-class reflection', icon: 'fi-sr-ticket', helpTh: 'แบบฟอร์มสะท้อนการเรียนรู้ 3 ช่อง: สิ่งที่เรียนรู้, คำถามที่ยังมี, สิ่งที่อยากรู้เพิ่ม', helpEn: '3-field reflection form: What I learned, Questions I still have, What I want to know more.', usageTh: 'เหมาะสำหรับ: สรุปบทเรียน, สะท้อนการเรียนรู้ท้ายคาบ', usageEn: 'Best for: Lesson wrap-up, end-of-class reflection' },
];

const NAMED_TOOL_TYPES = ['padlet', 'assignment', 'exit_ticket'];

interface StepConfig {
  type: string;
  title: string;
  config: Record<string, unknown>;
}

export default function QuickStartModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [step, setStep] = useState<'main-title' | 'type' | 'config' | 'templates'>('type');
  const [selectedType, setSelectedType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [allowFileUpload, setAllowFileUpload] = useState(false);
  const [pollMode, setPollMode] = useState<'mcq' | 'wordcloud'>('mcq');
  const [allowCustomChoices, setAllowCustomChoices] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
  }
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentEditingQuizQuestion, setCurrentEditingQuizQuestion] = useState<number | null>(null);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [steps, setSteps] = useState<StepConfig[]>([]);
  const [editingStepIndex, setEditingStepIndex] = useState<number>(-1);
  const [allowStudentNavigation, setAllowStudentNavigation] = useState(false);
  const [requireStudentName, setRequireStudentName] = useState(false);
  const [templates, setTemplates] = useState<Array<{ _id: string; title: string; config: Record<string, unknown> }>>([]);
  const [templateFeedback, setTemplateFeedback] = useState<string | null>(null);
  const [pickerTemplates, setPickerTemplates] = useState<Array<{ _id: string; title: string; type: string; config: Record<string, unknown> }>>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [mainTitle, setMainTitle] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  const handleOpen = () => {
    setOpen(true);
    setMode('single');
    setStep('type');
    setSelectedType('');
    setTitle('');
    setPrompt('');
    setAllowFileUpload(false);
    setPollMode('mcq');
    setAllowCustomChoices(false);
    setPollOptions(['', '']);
    setQuizQuestions([]);
    setSteps([]);
    setEditingStepIndex(-1);
    setAllowStudentNavigation(false);
    setRequireStudentName(false);
    setMainTitle('');
    setDescription('');
    setError(null);
  };

  const handleTypeSelect = (type: string) => {
    if (mode === 'multi') {
      setSelectedType(type);
      setStep('config');
    } else {
      setSelectedType(type === selectedType ? '' : type);
      if (mode === 'single') {
        setRequireStudentName(NAMED_TOOL_TYPES.includes(type));
      }
    }
  };

  const buildConfig = (): Record<string, unknown> => {
    const config: Record<string, unknown> = {};
    if (prompt.trim()) config.prompt = prompt.trim();
    if (allowFileUpload) config.allowFileUpload = true;
    if (pollMode) config.pollMode = pollMode;
    if (allowCustomChoices) config.allowCustomChoices = true;
    if (pollMode === 'mcq' && selectedType === 'poll') {
      const hasCustomOptions = pollOptions.some(o => o.trim());
      if (hasCustomOptions) {
        config.questions = [{ options: pollOptions.filter(o => o.trim()) }];
      }
    }
    if (selectedType === 'quiz') {
      const hasQuestions = quizQuestions.some(q => q.question.trim());
      if (hasQuestions) {
        config.questions = quizQuestions
          .filter(q => q.question.trim())
          .map(q => ({
            question: q.question.trim(),
            options: q.options.filter(o => o.trim()),
            correctAnswer: q.correctAnswer >= 0 ? q.correctAnswer : undefined,
          }));
      }
    }
    return config;
  };

  const handleAddStep = () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    const newStep: StepConfig = {
      type: selectedType,
      title: title.trim(),
      config: buildConfig(),
    };
    if (editingStepIndex >= 0) {
      const updated = [...steps];
      updated[editingStepIndex] = newStep;
      setSteps(updated);
      setEditingStepIndex(-1);
    } else {
      setSteps([...steps, newStep]);
    }
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

  const handleEditStep = (index: number) => {
    const s = steps[index];
    setSelectedType(s.type);
    setTitle(s.title);
    setPrompt((s.config.prompt as string) || '');
    setAllowFileUpload(!!s.config.allowFileUpload);
    setPollMode((s.config.pollMode as 'mcq' | 'wordcloud') || 'mcq');
    setAllowCustomChoices(!!s.config.allowCustomChoices);
    const questions = s.config.questions as Array<{ options: string[] }> | undefined;
    if (questions && questions[0]?.options) {
      setPollOptions([...questions[0].options, '']);
    } else {
      setPollOptions(['', '']);
    }
    setEditingStepIndex(index);
    setStep('config');
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    if (editingStepIndex === index) {
      setEditingStepIndex(-1);
      setStep('type');
    }
  };

  const handleSaveTemplate = async (stepIndex: number) => {
    const step = steps[stepIndex];
    const formData = new FormData();
    formData.set('type', step.type);
    formData.set('title', step.title);
    formData.set('config', JSON.stringify(step.config));
    const result = await saveTemplate(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setTemplateFeedback(`บันทึก "${step.title}" แล้ว`);
      setTimeout(() => setTemplateFeedback(null), 2000);
    }
  };

  const applyTemplate = (t: { config: Record<string, unknown>; title: string }) => {
    setTitle(t.title || '');
    setPrompt((t.config.prompt as string) || '');
    setPollMode((t.config.pollMode as 'mcq' | 'wordcloud') || 'mcq');
    setAllowFileUpload(!!t.config.allowFileUpload);
    setAllowCustomChoices(!!t.config.allowCustomChoices);
    if (t.config.questions && Array.isArray(t.config.questions)) {
      const qs = t.config.questions as Array<{ options?: string[] }>;
      if (qs[0]?.options) {
        setPollOptions([...qs[0].options, '']);
      }
    }
  };

  const openTemplatePicker = async () => {
    setLoadingPicker(true);
    try {
      const data = await getTemplates();
      setPickerTemplates(data as Array<{ _id: string; title: string; type: string; config: Record<string, unknown> }>);
    } catch {
      // silent
    } finally {
      setLoadingPicker(false);
    }
    setStep('templates');
    setPickerSearch('');
  };

  const handleSelectTemplate = (template: { _id: string; title: string; type: string; config: Record<string, unknown> }) => {
    setSteps(prev => [...prev, {
      type: template.type,
      title: template.title,
      config: template.config as Record<string, unknown>,
    }]);
    setStep('type');
    setError(null);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSteps(updated);
  };

  const handleSingleSubmit = async () => {
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
    if (requireStudentName) formData.set('requireStudentName', 'on');
    if (pollMode === 'mcq' && selectedType === 'poll') {
      const hasCustomOptions = pollOptions.some(o => o.trim());
      if (hasCustomOptions) {
        formData.set('questions', JSON.stringify([{ options: pollOptions }]));
      }
    }
    if (selectedType === 'quiz') {
      const hasQuestions = quizQuestions.some(q => q.question.trim());
      if (hasQuestions) {
        formData.set('questions', JSON.stringify(quizQuestions
          .filter(q => q.question.trim())
          .map(q => ({
            question: q.question.trim(),
            options: q.options.filter(o => o.trim()),
            correctAnswer: q.correctAnswer >= 0 ? q.correctAnswer : undefined,
          }))));
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

  const handleMultiSubmit = async () => {
    if (steps.length < 2) {
      setError('Add at least 2 steps for a multi-step session');
      return;
    }
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set('steps', JSON.stringify(steps));
    if (allowStudentNavigation) formData.set('allowStudentNavigation', 'on');
    if (requireStudentName) formData.set('requireStudentName', 'on');
    formData.set('type', steps[0].type);
    formData.set('title', mainTitle.trim() || steps[0].title);
    if (description.trim()) formData.set('description', description.trim());
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

  useEffect(() => {
    if (!(selectedType && mode === 'multi')) return;
    const ac = new AbortController();
    getTemplates(selectedType)
      .then((data) => {
        if (!ac.signal.aborted) {
          setTemplates(data as Array<{ _id: string; title: string; config: Record<string, unknown> }>);
        }
      })
      .catch(() => {});
    return () => ac.abort();
  }, [selectedType, mode]);

  const renderConfigFields = () => (
    <>
      {mode === 'multi' && templates.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-zinc-500 mb-2">แม่แบบที่มีอยู่:</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t._id}
                onClick={() => applyTemplate(t)}
                className="px-3 py-1.5 text-sm rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <i className="fi fi-sr-template text-xs mr-1" />
                {t.title}
              </button>
            ))}
          </div>
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
        <div className="space-y-3">
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

      {mode === 'single' && (
      <div className="flex items-center gap-2 pt-3 border-t border-zinc-200 dark:border-slate-700">
        <input
          type="checkbox"
          id="requireStudentName"
          checked={requireStudentName}
          onChange={e => setRequireStudentName(e.target.checked)}
          disabled={selectedType === 'assignment'}
          className="accent-blue-500 w-4 h-4"
        />
        <label htmlFor="requireStudentName" className={`text-sm font-medium ${selectedType === 'assignment' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
          ต้องใส่ชื่อ
        </label>
      </div>
      )}
    </>
  );

  const renderToolGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {TOOL_TYPES.map(tool => (
        <div key={tool.value} className="relative z-0 hover:z-50">
          <div
            onClick={() => handleTypeSelect(tool.value)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') handleTypeSelect(tool.value); }}
            className={`w-full p-4 rounded-xl text-left transition-all cursor-pointer ${
              selectedType === tool.value
                ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border border-zinc-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <i className={`fi ${tool.icon} text-blue-500 dark:text-blue-400 text-lg`} />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{tool.label}</span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 pl-8">{tool.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStepList = () => (
    <div className="space-y-2 mb-4">
      {steps.map((s, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-slate-900 border border-zinc-200 dark:border-slate-700"
        >
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 w-6">
            {idx + 1}
          </span>
          <span className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
            {s.title}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {TOOL_TYPES.find(tt => tt.value === s.type)?.label.split(' ')[0]}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleMoveStep(idx, 'up')}
              disabled={idx === 0}
              className="p-1 text-zinc-400 hover:text-blue-500 disabled:opacity-30 transition-colors"
            >
              <i className="fi fi-sr-arrow-up text-xs" />
            </button>
            <button
              onClick={() => handleMoveStep(idx, 'down')}
              disabled={idx === steps.length - 1}
              className="p-1 text-zinc-400 hover:text-blue-500 disabled:opacity-30 transition-colors"
            >
              <i className="fi fi-sr-arrow-down text-xs" />
            </button>
            <button
              onClick={() => handleSaveTemplate(idx)}
              className="p-1 text-zinc-400 hover:text-emerald-500 transition-colors"
              title="บันทึกเป็นแม่แบบ"
            >
              <i className="fi fi-sr-disk text-xs" />
            </button>
            <button
              onClick={() => handleEditStep(idx)}
              className="p-1 text-zinc-400 hover:text-blue-500 transition-colors"
            >
              <i className="fi fi-sr-pencil text-xs" />
            </button>
            <button
              onClick={() => handleRemoveStep(idx)}
              className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
            >
              <i className="fi fi-sr-trash text-xs" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStepSummary = () => (
    <div className="space-y-2 mb-4 bg-zinc-50 dark:bg-slate-900 rounded-xl p-4 border border-zinc-200 dark:border-slate-700">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1">
        <i className="fi fi-sr-list" />
        Steps ({steps.length})
      </p>
      {steps.map((s, idx) => (
        <div key={idx} className="flex items-center gap-2 py-1.5">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 w-5 shrink-0 text-center">
            {idx + 1}
          </span>
          <i className={`fi ${TOOL_TYPES.find(t => t.value === s.type)?.icon || 'fi-sr-box'} text-xs text-zinc-400 shrink-0`} />
          <span className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
            {s.title}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
            {TOOL_TYPES.find(tt => tt.value === s.type)?.label.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );

  const renderModeToggle = () => (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => { setMode('single'); setStep('type'); setQuizQuestions([]); }}
        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
          mode === 'single'
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-100 dark:bg-slate-700 text-zinc-500 dark:text-zinc-400'
        }`}
      >
        {t('singleTool')}
      </button>
      <button
        onClick={() => { setMode('multi'); setStep('type'); setQuizQuestions([]); }}
        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
          mode === 'multi'
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-100 dark:bg-slate-700 text-zinc-500 dark:text-zinc-400'
        }`}
      >
        {t('multiStep')}
      </button>
    </div>
  );

  const renderTemplatePicker = () => {
    const grouped = TOOL_TYPES.reduce<Record<string, Array<{ _id: string; title: string; type: string; config: Record<string, unknown> }>>>((acc, tool) => {
      const matching = pickerTemplates.filter(t =>
        t.type === tool.value &&
        (pickerSearch === '' || t.title.toLowerCase().includes(pickerSearch.toLowerCase()))
      );
      if (matching.length > 0) {
        acc[tool.value] = matching;
      }
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        {pickerTemplates.length === 0 && !loadingPicker ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <i className="fi fi-sr-drawer text-3xl mb-3 block text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm">No saved templates.</p>
            <p className="text-xs mt-1">Save a step as a template using the 💾 icon in the step builder.</p>
          </div>
        ) : loadingPicker ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="relative">
              <i className="fi fi-sr-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm" />
              <input
                type="text"
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            {Object.keys(grouped).length === 0 ? (
              <p className="text-center text-sm text-zinc-400 py-4">No templates match your search.</p>
            ) : (
              Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 flex items-center gap-1">
                    <i className={`fi ${TOOL_TYPES.find(t => t.value === type)?.icon || 'fi-sr-box'} text-xs`} />
                    {TOOL_TYPES.find(t => t.value === type)?.label || type}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {items.map(item => (
                      <button
                        key={item._id}
                        onClick={() => handleSelectTemplate(item)}
                        className="w-full p-3 rounded-xl text-left border border-zinc-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                      >
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {item.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    );
  };

  const renderMainTitle = () => (
    <div className="space-y-4">
      {renderStepSummary()}
      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
        <i className="fi fi-sr-info-circle mr-1" />
        Enter a name and optional description for your multi-step session
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Session Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={mainTitle}
          onChange={e => setMainTitle(e.target.value)}
          placeholder="e.g. Week 5 Review Activities"
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Description <span className="text-zinc-400 text-xs">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. A set of warm-up activities before the main lesson"
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requireStudentName"
          checked={requireStudentName}
          onChange={e => setRequireStudentName(e.target.checked)}
          className="accent-blue-500 w-4 h-4"
        />
        <label htmlFor="requireStudentName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          ต้องใส่ชื่อ
        </label>
      </div>
    </div>
  );

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
                {step === 'main-title'
                  ? 'Session Title'
                  : step === 'type'
                  ? 'Select Tool Type'
                  : step === 'templates'
                  ? 'Select Template'
                  : (editingStepIndex >= 0 ? 'Edit Step' : 'Configure Step')}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors"
              >
                <i className="fi fi-sr-cross text-lg" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {step === 'main-title' && renderMainTitle()}

              {step === 'type' && mode === 'single' && (
                <div>
                  {renderModeToggle()}
                  {renderToolGrid()}
                </div>
              )}

              {step === 'type' && mode === 'multi' && (
                <div>
                  {renderModeToggle()}
                  {steps.length > 0 && renderStepList()}
                  <button
                    onClick={openTemplatePicker}
                    className="w-full flex items-center justify-center gap-2 p-3 mb-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-slate-600 text-zinc-500 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all text-sm font-semibold"
                  >
                    <i className="fi fi-sr-layer-plus" />
                    From Template
                  </button>
                  {renderToolGrid()}
                </div>
              )}

              {step === 'templates' && renderTemplatePicker()}

              {step === 'config' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
                    <i className="fi fi-sr-info-circle mr-1" />
                    {TOOL_TYPES.find(tt => tt.value === selectedType)?.label}
                  </div>
                  {renderConfigFields()}
                  {templateFeedback && (
                    <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">{templateFeedback}</p>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4">
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-5 border-t border-zinc-200/60 dark:border-slate-700/50">
              {step === 'config' && (
                <>
                  <button
                    onClick={() => { setStep('type'); setEditingStepIndex(-1); }}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    <i className="fi fi-sr-arrow-left mr-1" />
                    Back
                  </button>
                  <button
                    onClick={mode === 'multi' ? handleAddStep : handleSingleSubmit}
                    disabled={pending || !title.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    <i className={`fi fi-sr-${mode === 'multi' ? 'plus' : 'play'} text-sm`} />
                    {pending ? 'Starting...' : mode === 'multi' ? (editingStepIndex >= 0 ? 'Update Step' : 'Add Step') : t('startSession')}
                  </button>
                </>
              )}

              {step === 'type' && mode === 'multi' && (
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={allowStudentNavigation}
                        onChange={e => setAllowStudentNavigation(e.target.checked)}
                        className="accent-blue-500 w-4 h-4"
                      />
                      Allow students to switch each question manually
                    </label>
                    <button
                      onClick={() => { setStep('main-title'); setError(null); }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all"
                    >
                      Next
                      <i className="fi fi-sr-arrow-right text-sm" />
                    </button>
                  </div>
                </div>
              )}

              {step === 'type' && mode === 'single' && (
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep('config')}
                    disabled={!selectedType}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    Next
                    <i className="fi fi-sr-arrow-right text-sm" />
                  </button>
                </div>
              )}

              {step === 'templates' && (
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={() => setStep('type')}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    <i className="fi fi-sr-arrow-left mr-1" />
                    Back
                  </button>
                  <Link
                    href="/admin/tools/templates"
                    onClick={() => setOpen(false)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <i className="fi fi-sr-pencil text-xs" />
                    Go to Edit Page
                  </Link>
                </div>
              )}

              {step === 'main-title' && (
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={() => setStep('type')}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    <i className="fi fi-sr-arrow-left mr-1" />
                    Back
                  </button>
                  <button
                    onClick={handleMultiSubmit}
                    disabled={pending || !mainTitle.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    <i className="fi fi-sr-play text-sm" />
                    {pending ? 'Starting...' : 'Start'}
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
