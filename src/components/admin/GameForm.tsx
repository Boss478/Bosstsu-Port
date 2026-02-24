'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import TagPicker from './TagPicker';

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnail || null
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await action(formData);
      if (result && result.error) {
        setError(result.error);
      } else {
        router.push('/admin/games');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setPending(false);
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

        <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
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
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                แนวเกม (Genre) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="genre"
                  defaultValue={initialData?.genre || ''}
                  required
                  className="appearance-none w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="" disabled>เลือกแนวเกม...</option>
                  {GENRE_OPTIONS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <i className="fi fi-sr-angle-small-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ลิงก์เล่นเกม (Play URL) <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="playUrl"
                defaultValue={initialData?.playUrl}
                required
                placeholder="https://example.com/play"
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              วิธีเล่น (Instructions)
            </label>
            <textarea
              name="instructions"
              defaultValue={initialData?.instructions}
              rows={4}
              placeholder="อธิบายวิธีเล่นเกมแบบสั้นๆ..."
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
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
                className="w-4 h-4 rounded accent-sky-500"
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
            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-slate-900 border-2 border-dashed border-zinc-300 dark:border-slate-700 hover:border-sky-500 transition-colors group">
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
          disabled={pending}
          className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'กำลังบันทึก...' : (isEdit ? 'อัปเดตข้อมูล' : 'สร้างเกม')}
        </button>
      </div>
    </form>
  );
}
