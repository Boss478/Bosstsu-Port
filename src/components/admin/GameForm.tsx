'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import TagPicker from './TagPicker';
import { useAdminSession } from './AdminSessionProvider';
import { useToast } from './ToastProvider';
import { uploadFileWithProgress } from '@/lib/client-upload';
import SaveProgress from './SaveProgress';

interface GameFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  action: (formData: FormData) => Promise<void | { error?: string }>;
  isEdit?: boolean;
  availableTags?: string[];
}

const GENRE_OPTIONS = [
  'Puzzle', 'Quiz', 'Strategy', 'Memory',
  'Simulation', 'Adventure', 'Educational', 'Other',
];

export default function GameForm({
  initialData,
  action,
  isEdit,
  availableTags = [],
}: GameFormProps) {
  const router = useRouter();
  const { setIsUploading, onAuthError } = useAdminSession();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameType, setGameType] = useState<'url' | 'html'>(
    initialData?.htmlContent ? 'html' : 'url'
  );
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnail || null
  );

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
      const formData = new FormData(e.currentTarget);
      const thumbnailEntry = formData.get('thumbnail');
      const thumbnailFile = (thumbnailEntry instanceof File && thumbnailEntry.size > 0) ? thumbnailEntry : null;

      let finalThumbnailUrl = initialData?.thumbnail || '';
      if (thumbnailFile) {
        setStatusText('กำลังอัปโหลดรูปหน้าปก...');
        setProgress(5);
        const fileSize = thumbnailFile.size;
        finalThumbnailUrl = await uploadFileWithProgress(thumbnailFile, 'games', (loaded) => {
          if (fileSize > 0) {
            setProgress(5 + (loaded / fileSize) * 85);
          }
        }, signal);
        setProgress(90);
      } else if (!isEdit) {
        throw new Error('กรุณาเลือกรูปหน้าปก');
      }

      setStatusText('กำลังบันทึกข้อมูลเข้าฐานข้อมูล...');
      setProgress(95);

      if (finalThumbnailUrl) formData.set('thumbnailUrl', finalThumbnailUrl);
      formData.delete('thumbnail');

      const result = await action(formData);

      if (result?.error) {
        if (result.error.includes('[401]')) {
          setIsSubmitting(false);
          onAuthError();
          return;
        }
        throw new Error(result.error);
      }

      setProgress(100);
      setStatusText('บันทึกข้อมูลสำเร็จ!');

      setTimeout(() => {
        router.push('/admin/games');
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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
            ข้อมูลเกม (Game Details)
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ชื่อเกม (Title) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              defaultValue={initialData?.title}
              required
              placeholder="เกมจับคู่คำศัพท์"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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

          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">
              ประเภทเกม (Game Type) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="gameType"
                  value="url"
                  checked={gameType === 'url'}
                  onChange={() => setGameType('url')}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  External Site (URL)
                </span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="gameType"
                  value="html"
                  checked={gameType === 'html'}
                  onChange={() => setGameType('html')}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  One-page HTML
                </span>
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                แนวเกม (Genre) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="category"
                  defaultValue={initialData?.category || ''}
                  required
                  className="appearance-none w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="" disabled>เลือกแนวเกม...</option>
                  {GENRE_OPTIONS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <i className="fi fi-sr-angle-small-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {gameType === 'url' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  ลิงก์เล่นเกม (Play URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="playUrl"
                  defaultValue={initialData?.playUrl}
                  required
                  placeholder="https://example.com/play"
                  className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            ) : (
              <input
                type="hidden"
                name="playUrl"
                value=""
              />
            )}
          </div>

          {gameType === 'html' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                HTML Content <span className="text-red-500">*</span>
              </label>
              <textarea
                name="htmlContent"
                defaultValue={initialData?.htmlContent || ''}
                required={gameType === 'html'}
                rows={10}
                placeholder="<!DOCTYPE html>\n<html>...</html>"
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ใส่โค้ด HTML แบบเต็มหน้า (รองรับ CSS และ JavaScript)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              วิธีเล่น (Instructions)
            </label>
            <textarea
              name="instructions"
              defaultValue={initialData?.instructions}
              rows={4}
              placeholder="อธิบายวิธีเล่นเกมแบบสั้นๆ..."
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
            หน้าปก
          </h3>

          {/* Published Toggle */}
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="published"
                defaultChecked={initialData?.published !== false}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Public
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              รูปปก (Thumbnail) <span className="text-red-500">*</span>
            </label>
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-zinc-100 dark:bg-slate-900 border-2 border-dashed border-zinc-300 dark:border-slate-700 hover:border-blue-500 transition-colors group">
              {thumbnailPreview ? (
                <Image
                  src={thumbnailPreview}
                  alt="Thumbnail Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                  <i className="fi fi-sr-image text-3xl" />
                </div>
              )}
              <input
                type="file"
                name="thumbnail"
                accept="image/*"
                onChange={handleThumbnailChange}
                required={!isEdit}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              แท็ก (Tags)
            </label>
            <TagPicker
              name="tags"
              availableTags={availableTags}
              initialTags={initialData?.tags}
              category="game"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'กำลังบันทึก...' : (isEdit ? 'อัปเดตข้อมูล' : 'สร้างเกม')}
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
