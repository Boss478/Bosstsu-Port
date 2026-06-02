'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import TagPicker from './TagPicker';
import { useAdminSession } from './AdminSessionProvider';
import { useToast } from './ToastProvider';
import { uploadFileWithProgress, clientValidateFileType } from '@/lib/client-upload';
import SaveProgress from './SaveProgress';

const RichTextEditor = dynamic(
  () => import('./RichTextEditor'),
  { ssr: false, loading: () => <div className="h-48 rounded-xl bg-zinc-100 dark:bg-slate-800 animate-pulse" /> }
);

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
function HtmlEditor({ initialValue = '' }: { initialValue?: string }) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
        <i className="fi fi-sr-edit text-blue-500" />
        เนื้อหา (Content) <span className="text-red-500">*</span>
      </label>

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
const THUMBNAIL_REQUIRED_TYPES = ['Presentation', 'Lesson Plan', 'Sheet', 'Worksheet', 'Scratch', 'Interactive'];

interface LearningFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  action: (formData: FormData) => Promise<void | { error?: string; id?: string }>;
  mediaAction: (id: string, formData: FormData) => Promise<void | { error?: string }>;
  isEdit?: boolean;
  incompleteUpload?: boolean;
  availableTags?: string[];
}

export default function LearningForm({
  initialData,
  action,
  mediaAction,
  isEdit,
  incompleteUpload,
  availableTags = [],
}: LearningFormProps) {
  const router = useRouter();
  const { setIsUploading, onAuthError } = useAdminSession();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(initialData?.type || '');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.thumbnail || null);
  const batchIdRef = useRef(uuidv4());

  const typeConfig = useMemo(
    () => TYPE_OPTIONS.find(t => t.value === selectedType),
    [selectedType]
  );
  const mode: TypeMode | undefined = typeConfig?.mode;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    setProgress(0);
    setIsUploading(true);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const formElement = e.currentTarget;
      let itemId: string | undefined = initialData?._id;

      // Phase 1: Save text to DB
      setStatusText('กำลังบันทึกข้อมูล...');
      setProgress(5);

      const textFormData = new FormData(formElement);
      textFormData.delete('thumbnail');
      textFormData.delete('resourceFile');
      textFormData.delete('thumbnailUrl');
      textFormData.delete('fileUrl');

      if (isEdit) {
        const result = await action(textFormData);
        if (result?.error) throw new Error(result.error);
      } else {
        const result = await action(textFormData) as { error?: string; id?: string };
        if (result?.error) throw new Error(result.error);
        itemId = result?.id;
      }

      if (!itemId) throw new Error('ไม่พบ ID เอกสาร');

      setProgress(25);

      // Phase 2: Upload files (only if new files exist)
      const uploadFormData = new FormData(formElement);
      const thumbnailEntry = uploadFormData.get('thumbnail');
      const thumbnailFile = (thumbnailEntry instanceof File && thumbnailEntry.size > 0) ? thumbnailEntry : null;
      const resourceEntry = uploadFormData.get('resourceFile');
      const resourceFile = (resourceEntry instanceof File && resourceEntry.size > 0) ? resourceEntry : null;

      if (resourceFile && typeConfig && 'accept' in typeConfig) {
        const allowedTypes = typeConfig.accept.split(',');
        if (!clientValidateFileType(resourceFile, allowedTypes)) {
          throw new Error(`ประเภทไฟล์ไม่ถูกต้อง อนุญาต: ${allowedTypes.join(', ')}`);
        }
      }

      const totalBytes = (thumbnailFile?.size || 0) + (resourceFile?.size || 0);
      let finalThumbnailUrl = initialData?.thumbnail || '';
      let finalFileUrl = initialData?.fileUrl || '';
      let uploadedBytes = 0;
      const updateProgress = (chunkLoaded: number) => {
        if (totalBytes === 0) return;
        const currentTotal = uploadedBytes + chunkLoaded;
        setProgress(25 + (currentTotal / totalBytes) * 65);
      };

      if (totalBytes > 0) {
        if (thumbnailFile) {
          setStatusText('กำลังอัปโหลดรูปหน้าปก...');
          finalThumbnailUrl = await uploadFileWithProgress(thumbnailFile, 'learning', updateProgress, signal, batchIdRef.current);
          uploadedBytes += thumbnailFile.size;
          setProgress(25 + (uploadedBytes / totalBytes) * 65);
        }

        if (resourceFile) {
          setStatusText('กำลังอัปโหลดไฟล์...');
          finalFileUrl = await uploadFileWithProgress(resourceFile, 'learning', updateProgress, signal, batchIdRef.current);
          uploadedBytes += resourceFile.size;
          setProgress(25 + (uploadedBytes / totalBytes) * 65);
        }
      } else {
        setProgress(90);
      }

      // Phase 3: Save media + publish (always runs)
      setStatusText('กำลังบันทึกข้อมูลเข้าฐานข้อมูล...');
      setProgress(95);

      const mediaFormData = new FormData();
      if (finalThumbnailUrl) mediaFormData.set('thumbnailUrl', finalThumbnailUrl);
      if (finalFileUrl) mediaFormData.set('fileUrl', finalFileUrl);
      const publishedInput = formElement.querySelector<HTMLInputElement>('[name="published"]');
      if (publishedInput?.checked) mediaFormData.set('published', 'on');

      const mediaResult = await mediaAction(itemId, mediaFormData);
      if (mediaResult?.error) throw new Error(mediaResult.error);

      setProgress(100);
      setStatusText('บันทึกข้อมูลสำเร็จ!');
      batchIdRef.current = uuidv4();

      setTimeout(() => {
        router.push('/admin/resources');
      }, 500);

    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('[401]')) {
          setIsSubmitting(false);
          onAuthError();
          return;
        }
        if (err.message === 'Upload aborted') {
          setIsSubmitting(false);
          return;
        }
        setError(err.message);
        showToast(err.message, 'error');
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่คาดคิด');
        showToast('เกิดข้อผิดพลาดที่ไม่คาดคิด', 'error');
      }
      setIsSubmitting(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Left Column ── */}
      <div className="lg:col-span-2 space-y-6">
        {incompleteUpload && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50 text-sm flex items-start gap-3">
            <i className="fi fi-sr-exclamation mt-0.5 flex shrink-0" />
            <span>บันทึกข้อมูลสำเร็จ แต่รูปภาพยังไม่ได้อัปโหลด กรุณาเพิ่มรูปภาพและบันทึกอีกครั้ง</span>
          </div>
        )}
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
                <Image src={thumbnailPreview} alt="Thumbnail Preview" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
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
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'กำลังบันทึก...' : isEdit ? 'อัปเดตข้อมูล' : 'สร้างสื่อการเรียนรู้'}
        </button>
      </div>

      <SaveProgress
        isOpen={isSubmitting}
        progress={progress}
        statusText={statusText}
        onCancel={() => abortRef.current?.abort()}
      />
    </form>
  );
}
