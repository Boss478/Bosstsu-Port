'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import TagPicker from './TagPicker';
import RichTextEditor from './RichTextEditor';
import { useAdminSession } from './AdminSessionProvider';

const SUBJECT_OPTIONS = [
  'คณิตศาสตร์ (Mathematics)',
  'วิทยาศาสตร์ (Science)',
  'ภาษาไทย (Thai)',
  'ประวัติศาสตร์ (History)',
  'เทคโนโลยี (Technology)',
  'ศิลปะ (Art)',
  'สังคมศึกษา (Social Studies)',
  'อื่น ๆ (Other)',
];

const TYPE_OPTIONS = [
  { value: 'Article',      label: 'Article',      mode: 'html' },
  { value: 'Presentation', label: 'Presentation',  mode: 'presentation' },
  { value: 'Video',        label: 'Video',         mode: 'youtube' },
  { value: 'Lesson Plan',  label: 'Lesson Plan',   mode: 'file', accept: 'application/pdf', acceptLabel: 'PDF' },
  { value: 'Sheet',        label: 'Sheet',         mode: 'file', accept: 'image/jpeg,image/png,application/pdf', acceptLabel: 'JPG, PNG, PDF' },
  { value: 'Worksheet',    label: 'Worksheet',     mode: 'file', accept: 'image/jpeg,image/png,application/pdf', acceptLabel: 'JPG, PNG, PDF' },
  { value: 'Scratch',      label: 'Scratch',       mode: 'embed' },
  { value: 'Interactive',  label: 'Interactive',   mode: 'embed' },
] as const;

type TypeMode = typeof TYPE_OPTIONS[number]['mode'];

// ─── HTML Content Editor with RichTextEditor ───────────────────────────────
// Show RichTextEditor + Link field for Article type
function HtmlEditor({ initialValue = '' }: { initialValue?: string }) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
        <i className="fi fi-sr-edit text-blue-500" />
        เนื้อหา (Content) <span className="text-red-500">*</span>
      </label>
      
      {/* Rich Text Editor */}
      <RichTextEditor
        name="content"
        defaultValue={initialValue}
        placeholder="พิมพ์เนื้อหาบทเรียนที่นี่..."
        required
      />
    </div>
  );
}

// ─── File Upload Field ─────────────────────────────────────────────────────────
function FileUploadField({
  accept,
  acceptLabel,
  existingUrl,
}: {
  accept: string;
  acceptLabel: string;
  existingUrl?: string;
}) {
  const [fileName, setFileName] = useState('');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        ไฟล์ ({acceptLabel})
      </label>
      {existingUrl && !fileName && (
        <p className="text-xs text-zinc-500 truncate">
          ไฟล์ปัจจุบัน: <span className="font-mono">{existingUrl}</span>
        </p>
      )}
      <label className="flex items-center gap-3 w-full px-4 py-5 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-zinc-300 dark:border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
        <i className="fi fi-sr-cloud-upload text-xl text-zinc-400" />
        <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
          {fileName || 'คลิกเพื่ออัปโหลดไฟล์'}
        </span>
        <input
          type="file"
          name="resourceFile"
          accept={accept}
          onChange={e => setFileName(e.target.files?.[0]?.name || '')}
          className="sr-only"
        />
      </label>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
interface LearningFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  action: (formData: FormData) => Promise<void | { error?: string }>;
  isEdit?: boolean;
  availableTags?: string[];
}

export default function LearningForm({
  initialData,
  action,
  isEdit,
  availableTags = [],
}: LearningFormProps) {
  const router = useRouter();
  const { onAuthError } = useAdminSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(initialData?.type || '');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.thumbnail || null);

  const typeConfig = useMemo(
    () => TYPE_OPTIONS.find(t => t.value === selectedType),
    [selectedType]
  );
  const mode: TypeMode | undefined = typeConfig?.mode;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await action(new FormData(e.currentTarget));
      if (result?.error) {
        if (result.error.includes('[401]')) {
          setPending(false);
          onAuthError();
          return;
        }
        setError(result.error);
      } else {
        router.push('/admin/resources');
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Left Column ── */}
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Basic Info Card */}
        <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
            ข้อมูลสื่อ (Resource Details)
          </h3>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ชื่อสื่อ (Title) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              defaultValue={initialData?.title}
              required
              placeholder="บทเรียนออนไลน์เรื่องเศษส่วน"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              รายละเอียด (Description) <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              defaultValue={initialData?.description}
              required
              rows={3}
              placeholder="คำอธิบายสั้น ๆ เกี่ยวกับเนื้อหา"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subject + Type */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                วิชา (Subject) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="subject"
                  defaultValue={initialData?.subject || ''}
                  required
                  className="appearance-none w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="" disabled>เลือกวิชา...</option>
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <i className="fi fi-sr-angle-small-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ประเภท (Type) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="type"
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  required
                  className="appearance-none w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="" disabled>เลือกประเภท...</option>
                  {TYPE_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <i className="fi fi-sr-angle-small-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Type-Specific Content Card */}
        {selectedType && (
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              เนื้อหา — {selectedType}
            </h3>

            {/* Article: HTML Editor + link */}
            {mode === 'html' && (
              <div className="space-y-4">
                <HtmlEditor initialValue={initialData?.content} />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    ลิงก์เพิ่มเติม / PDF URL (Link)
                  </label>
                  <input
                    type="url"
                    name="link"
                    defaultValue={initialData?.link || ''}
                    placeholder="https://example.com/article หรือ /uploads/learning/doc.pdf"
                    className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Presentation: Canva URL + PDF upload */}
            {mode === 'presentation' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Canva Embed URL
                  </label>
                  <input
                    type="url"
                    name="canvaEmbed"
                    defaultValue={initialData?.canvaEmbed || ''}
                    placeholder="https://www.canva.com/design/xxxxx/view?embed"
                    className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ใส่ Canva URL หรืออัปโหลด PDF ด้านล่าง
                  </p>
                </div>
                <FileUploadField accept="application/pdf" acceptLabel="PDF" existingUrl={initialData?.fileUrl} />
              </div>
            )}

            {/* Video: YouTube URL */}
            {mode === 'youtube' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  YouTube URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="youtubeId"
                  defaultValue={initialData?.youtubeId || initialData?.link || ''}
                  required
                  placeholder="https://youtube.com/watch?v=xxxxx หรือ https://youtu.be/xxxxx"
                  className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            )}

            {/* Lesson Plan / Sheet / Worksheet: file upload */}
            {mode === 'file' && typeConfig && 'accept' in typeConfig && (
              <FileUploadField
                accept={typeConfig.accept}
                acceptLabel={typeConfig.acceptLabel}
                existingUrl={initialData?.fileUrl}
              />
            )}

            {/* Scratch / Interactive: embed code */}
            {mode === 'embed' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Embed Code <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="embedCode"
                  defaultValue={initialData?.embedCode || ''}
                  rows={5}
                  required
                  placeholder={'<iframe src="https://scratch.mit.edu/projects/xxxxx/embed" ...></iframe>'}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right Column ── */}
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
            หน้าปก
          </h3>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initialData?.published !== false}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Public</span>
          </label>

          {/* Thumbnail */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              รูปปก (Thumbnail)
            </label>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-slate-900 border-2 border-dashed border-zinc-300 dark:border-slate-700 hover:border-blue-500 transition-colors">
              {thumbnailPreview ? (
                <Image src={thumbnailPreview} alt="Thumbnail Preview" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                  <i className="fi fi-sr-image text-3xl" />
                </div>
              )}
              <input
                type="file"
                name="thumbnail"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setThumbnailPreview(URL.createObjectURL(file));
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              แท็ก (Tags)
            </label>
            <TagPicker
              name="tags"
              availableTags={availableTags}
              initialTags={initialData?.tags}
              category="learning"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'กำลังบันทึก...' : isEdit ? 'อัปเดตข้อมูล' : 'สร้างสื่อการเรียนรู้'}
        </button>
      </div>
    </form>
  );
}