'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { quickStartSession } from '@/app/admin/tools/actions';
import { t } from '@/lib/tool-translations';

const TOOL_TYPES = [
  { value: 'padlet', label: 'Padlet (Idea Board)', desc: 'Collect ideas on a digital board · Brainstorming, sharing work, visual collaboration', icon: 'fi-sr-grid', helpTh: 'นักเรียนโพสต์ไอเดีย รูปภาพ หรือลิงก์บนบอร์ดดิจิทัลร่วมกัน', helpEn: 'Students post ideas, images, or links on a shared digital board.', usageTh: 'เหมาะสำหรับ: ระดมสมอง, แชร์ผลงาน, Brainstorming', usageEn: 'Best for: Brainstorming, sharing work, visual collaboration' },
  { value: 'poll', label: 'Poll (Mentimeter)', desc: 'MCQ or word cloud voting · Opinion polls, understanding checks, quick feedback', icon: 'fi-sr-chart-pie', helpTh: 'สร้างคำถามแบบเลือกตอบหรือ Word Cloud นักเรียนโหวตและเห็นผลลัพธ์แบบเรียลไทม์', helpEn: 'Create MCQ or word cloud polls. Students vote and see live results.', usageTh: 'เหมาะสำหรับ: สำรวจความคิดเห็น, เช็คความเข้าใจ, Quick feedback', usageEn: 'Best for: Opinion polls, understanding checks, quick feedback' },
  { value: 'assignment', label: 'Assignment', desc: 'Text answers + file upload · Homework, project submissions, work requiring file attachments', icon: 'fi-sr-file-upload', helpTh: 'นักเรียนส่งคำตอบเป็นข้อความและอัปโหลดไฟล์ (PDF, รูปภาพ) ได้', helpEn: 'Students submit text answers and optionally upload files (PDF, images).', usageTh: 'เหมาะสำหรับ: การบ้าน, ส่งโปรเจกต์, งานที่ต้องมีไฟล์ประกอบ', usageEn: 'Best for: Homework, project submissions, work requiring file attachments' },
  { value: 'qa_board', label: 'Q&A Board', desc: 'Anonymous Q&A with voting · Post-lesson Q&A, identifying common confusions', icon: 'fi-sr-interrogation', helpTh: 'นักเรียนตั้งคำถามแบบไม่ระบุตัวตน โหวตคำถามที่อยากได้คำตอบมากที่สุด', helpEn: 'Students ask questions anonymously. Vote on questions they want answered most.', usageTh: 'เหมาะสำหรับ: ถาม-ตอบหลังเรียน, ระบุจุดที่สับสนร่วมกัน', usageEn: 'Best for: Post-lesson Q&A, identifying common confusions' },
  { value: 'quiz', label: 'Quick Quiz', desc: 'Multiple choice quiz with scoring · Comprehension tests, formative assessment', icon: 'fi-sr-graduation-cap', helpTh: 'สร้างควิซแบบเลือกตอบหลายข้อ นักเรียนได้คะแนนและฟีดแบ็กทันที', helpEn: 'Create multi-question MCQ quizzes. Students get instant scores and feedback.', usageTh: 'เหมาะสำหรับ: ทดสอบความเข้าใจ, ประเมินผลระหว่างเรียน', usageEn: 'Best for: Comprehension tests, formative assessment' },
  { value: 'exit_ticket', label: 'Exit Ticket', desc: '3-field reflection form · Lesson wrap-up, end-of-class reflection', icon: 'fi-sr-ticket', helpTh: 'แบบฟอร์มสะท้อนการเรียนรู้ 3 ช่อง: สิ่งที่เรียนรู้, คำถามที่ยังมี, สิ่งที่อยากรู้เพิ่ม', helpEn: '3-field reflection form: What I learned, Questions I still have, What I want to know more.', usageTh: 'เหมาะสำหรับ: สรุปบทเรียน, สะท้อนการเรียนรู้ท้ายคาบ', usageEn: 'Best for: Lesson wrap-up, end-of-class reflection' },
  { value: 'discussion', label: 'Discussion Forum', desc: 'Threaded conversation board · Group discussions, exchanging opinions, peer learning', icon: 'fi-sr-comments', helpTh: 'นักเรียนเริ่มหัวข้อสนทนาและตอบกลับซึ่งกันและกันแบบ Thread', helpEn: 'Students start discussion threads and reply to each other.', usageTh: 'เหมาะสำหรับ: อภิปรายกลุ่ม, แลกเปลี่ยนความคิดเห็น, Peer learning', usageEn: 'Best for: Group discussions, exchanging opinions, peer learning' },
];

interface StepConfig {
  type: string;
  title: string;
  config: Record<string, unknown>;
}

export default function QuickStartModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'single' | 'multi'>('single');
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

  const [steps, setSteps] = useState<StepConfig[]>([]);
  const [editingStepIndex, setEditingStepIndex] = useState<number>(-1);
  const [allowStudentNavigation, setAllowStudentNavigation] = useState(false);
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
    setSteps([]);
    setEditingStepIndex(-1);
    setAllowStudentNavigation(false);
    setError(null);
  };

  const handleTypeSelect = (type: string) => {
    if (mode === 'multi') {
      setSelectedType(type);
      setStep('config');
    } else {
      setSelectedType(type === selectedType ? '' : type);
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
    formData.set('type', steps[0].type);
    formData.set('title', steps[0].title);
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

  const renderConfigFields = () => (
    <>
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

  const renderModeToggle = () => (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => { setMode('single'); setStep('type'); }}
        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
          mode === 'single'
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-100 dark:bg-slate-700 text-zinc-500 dark:text-zinc-400'
        }`}
      >
        {t('singleTool')}
      </button>
      <button
        onClick={() => { setMode('multi'); setStep('type'); }}
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
                {step === 'type'
                  ? 'Select Tool Type'
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
                  {renderToolGrid()}
                </div>
              )}

              {step === 'config' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
                    <i className="fi fi-sr-info-circle mr-1" />
                    {TOOL_TYPES.find(tt => tt.value === selectedType)?.label}
                  </div>
                  {renderConfigFields()}
                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>
                  )}
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
                <>
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
                      onClick={handleMultiSubmit}
                      disabled={pending || steps.length < 2}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                    >
                      <i className="fi fi-sr-play text-sm" />
                      {pending ? 'Starting...' : 'Start'}
                    </button>
                  </div>
                </>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
