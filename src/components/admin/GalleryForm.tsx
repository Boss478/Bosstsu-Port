'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ImageCropper from './ImageCropper';
import TagPicker from './TagPicker';

interface GalleryFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  portfolios?: { _id: string; title: string }[];
  action: (formData: FormData) => Promise<void | { error?: string }>;
  isEdit?: boolean;
  availableTags?: string[];
}

export default function GalleryForm({ initialData, portfolios, action, isEdit, availableTags = [] }: GalleryFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.cover || null);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [croppedCoverBlob, setCroppedCoverBlob] = useState<Blob | null>(null);
  const [previewModalSrc, setPreviewModalSrc] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState(initialData?.slug || '');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('existingPhotos', JSON.stringify(photos));

    if (croppedCoverBlob) {
      formData.set('cover', croppedCoverBlob, 'cropped_cover.jpg');
    }

    try {
      const result = await action(formData);
      if (result && result.error) {
        setError(result.error);
      } else {
        router.push('/admin/gallery');
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
      setCropImageSrc(URL.createObjectURL(file));
      e.target.value = '';
    }
  };

  const handleCropComplete = (blob: Blob) => {
    setCroppedCoverBlob(blob);
    setCoverPreview(URL.createObjectURL(blob));
    setCropImageSrc(null);
  };
  
  const handleCropCancel = () => {
    setCropImageSrc(null);
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setNewPhotoPreviews(prev => [...prev, ...newPreviews]);
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
            ข้อมูลอัลบั้ม (Album Details)
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ชื่ออัลบั้ม (Title) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                defaultValue={initialData?.title}
                required
                onChange={handleTitleChange}
                placeholder="ทัศนศึกษา Open House 2025"
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={autoSlug}
                onChange={handleSlugChange}
                required
                placeholder="gallery-album-name"
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              รายละเอียด (Description)
            </label>
            <textarea
              name="description"
              defaultValue={initialData?.description}
              rows={3}
              placeholder="คำอธิบายสั้น ๆ เกี่ยวกับเนื้อหา"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              เชื่อมโยงผลงาน (Linked Portfolio)
            </label>
            <div className="relative">
              <select
                name="relatedPortfolioId"
                defaultValue={initialData?.relatedPortfolioId || ''}
                className="appearance-none w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">ไม่มี (None)</option>
                {portfolios?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <i className="fi fi-sr-angle-small-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              รูปภาพในอัลบั้ม (Photos)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                  <Image src={photo} alt={`Photo ${index}`} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPreviewModalSrc(photo)}
                      className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-colors"
                      title="ดูรูปขยาย (View Full)"
                    >
                      <i className="fi fi-sr-expand flex" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(index)}
                      className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-md transition-colors"
                      title="ลบรูปนี้ (Remove)"
                    >
                      <i className="fi fi-sr-trash flex" />
                    </button>
                  </div>
                </div>
              ))}
              {newPhotoPreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-sky-500 group">
                  <Image src={preview} alt="New Upload" fill className="object-cover" />
                  <div className="absolute top-1 left-1 bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none z-10">
                    NEW
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPreviewModalSrc(preview)}
                      className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-colors"
                      title="ดูรูปขยาย (View Full)"
                    >
                      <i className="fi fi-sr-expand flex" />
                    </button>
                  </div>
                </div>
              ))}
              
              <label 
                htmlFor="photos-upload-input"
                className="relative aspect-square rounded-lg border-2 border-dashed border-zinc-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-sky-500 transition-colors bg-zinc-50 dark:bg-slate-900"
              >
                <div className="text-center pointer-events-none">
                  <i className="fi fi-sr-add text-2xl text-zinc-400" />
                  <p className="text-xs text-zinc-500 mt-1">เพิ่มรูป</p>
                </div>
              </label>
              <input
                id="photos-upload-input"
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
                <>
                  <Image
                    src={coverPreview}
                    alt="Cover Preview"
                    fill
                    className="object-cover cursor-pointer"
                    onClick={() => setPreviewModalSrc(coverPreview)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setPreviewModalSrc(coverPreview)}
                      className="px-4 py-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md transition-colors flex items-center gap-2 text-sm shadow-xl"
                    >
                      <i className="fi fi-sr-expand flex" /> ดูเต็มจอ (View)
                    </button>
                    <label
                      htmlFor="cover-upload-input"
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xl cursor-pointer transition-colors flex items-center gap-2 text-sm"
                    >
                      <i className="fi fi-sr-pencil flex" /> เปลี่ยนรูป (Change)
                    </label>
                  </div>
                </>
              ) : (
                <label 
                  htmlFor="cover-upload-input"
                  className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <i className="fi fi-sr-add-image text-3xl mb-2" />
                  <span className="text-sm">อัปโหลดรูปปก (Cover)</span>
                </label>
              )}
            </div>
            <input
              id="cover-upload-input"
              type="file"
              name="cover"
              accept="image/*"
              onChange={handleCoverChange}
              required={!isEdit && !croppedCoverBlob}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              วันที่ (Date) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              defaultValue={initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
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
              category="gallery"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'กำลังบันทึก...' : (isEdit ? 'อัปเดตข้อมูล' : 'สร้างอัลบั้ม')}
        </button>
      </div>

      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={16 / 9}
        />
      )}

      {previewModalSrc && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in-up"
          onClick={() => setPreviewModalSrc(null)}
        >
          <button 
            type="button"
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 flex items-center justify-center transition-all z-10"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewModalSrc(null);
            }}
          >
            <i className="fi fi-sr-cross text-xl flex" />
          </button>
          <div 
            className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewModalSrc}
              alt="Full Screen Preview"
              fill
              className="object-contain drop-shadow-2xl"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </form>
  );
}
