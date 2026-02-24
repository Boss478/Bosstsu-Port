'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import TagPicker from './TagPicker';
import RichTextEditor from './RichTextEditor';

interface PortfolioFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  action: (formData: FormData) => Promise<void | { error?: string }>;
  isEdit?: boolean;
  availableTags?: string[];
  availableTools?: string[];
}

export default function PortfolioForm({
  initialData,
  action,
  isEdit,
  availableTags = [],
  availableTools = [],
}: PortfolioFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialData?.cover || null
  );
  const [autoSlug, setAutoSlug] = useState(initialData?.slug || '');
  const [photos, setPhotos] = useState<string[]>(initialData?.gallery || []);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('existingPhotos', JSON.stringify(photos));

    try {
      const result = await action(formData);
      if (result && result.error) {
        setError(result.error);
      } else {
        router.push('/admin/portfolio');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setPending(false);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const previews = Array.from(files).map(file => URL.createObjectURL(file));
      setNewPhotoPreviews(prev => [...prev, ...previews]);
    }
  };

  const removeExistingPhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const toSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit) {
      setAutoSlug(toSlug(e.target.value));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s+/g, '-');
    setAutoSlug(val);
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
            ข้อมูลทั่วไป (General Info)
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ชื่อผลงาน (Title) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                defaultValue={initialData?.title}
                required
                onChange={handleTitleChange}
                placeholder="โครงการพัฒนาสื่อการเรียนรู้"
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Slug (URL) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={autoSlug}
                onChange={handleSlugChange}
                required
                placeholder="portfolio-project-name"
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              รายละเอียดแบบย่อ (Short Description) <span className="text-red-500">*</span>
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              เนื้อหาหลัก (Content) <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              name="content"
              defaultValue={initialData?.content}
              placeholder="พิมพ์เนื้อหาผลงานที่นี่..."
              required
            />
          </div>
        </div>

        {/* Gallery Photos */}
        <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
            รูปภาพประกอบ (Gallery)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                <Image src={photo} alt={`Photo ${index}`} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(index)}
                    className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-md transition-colors"
                    title="ลบรูปนี้"
                  >
                    <i className="fi fi-sr-trash flex" />
                  </button>
                </div>
              </div>
            ))}
            {newPhotoPreviews.map((preview, index) => (
              <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-sky-500">
                <Image src={preview} alt="New Upload" fill className="object-cover" />
                <div className="absolute top-1 left-1 bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none z-10">
                  NEW
                </div>
              </div>
            ))}
            <label
              htmlFor="gallery-upload-input"
              className="relative aspect-square rounded-lg border-2 border-dashed border-zinc-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-sky-500 transition-colors bg-zinc-50 dark:bg-slate-900"
            >
              <div className="text-center pointer-events-none">
                <i className="fi fi-sr-add text-2xl text-zinc-400" />
                <p className="text-xs text-zinc-500 mt-1">เพิ่มรูป</p>
              </div>
            </label>
            <input
              id="gallery-upload-input"
              type="file"
              name="photos"
              accept="image/*"
              multiple
              onChange={handlePhotosChange}
              className="hidden"
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
              รูปปก (Cover Image) <span className="text-red-500">*</span>
            </label>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-slate-900 border-2 border-dashed border-zinc-300 dark:border-slate-700 hover:border-sky-500 transition-colors group">
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt="Cover Preview"
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
                name="cover"
                accept="image/*"
                onChange={handleCoverChange}
                required={!isEdit}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-xs text-zinc-500">
              Click to upload. Max 5MB. JPG, PNG, WEBP.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              วันที่ (Date) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              defaultValue={
                initialData?.date
                  ? new Date(initialData.date).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
              required
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              แท็ก (Tags)
            </label>
            <TagPicker
              name="tags"
              availableTags={availableTags}
              initialTags={initialData?.tags}
              category="portfolio"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              เครื่องมือที่ใช้ (Tools)
            </label>
            <TagPicker
              name="tools"
              availableTags={availableTools}
              initialTags={initialData?.tools}
              category="tools"
              placeholder="เพิ่มเครื่องมือ"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending
            ? 'กำลังบันทึก...'
            : isEdit
              ? 'อัปเดตข้อมูล'
              : 'สร้างผลงาน'}
        </button>
      </div>
    </form>
  );
}
