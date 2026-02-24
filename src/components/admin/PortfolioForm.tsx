'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import TagPicker from './TagPicker';
import RichTextEditor from './RichTextEditor';
import SaveProgress from './SaveProgress';
import { useAdminSession } from './AdminSessionProvider';

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
  const { setIsUploading } = useAdminSession();
  
  // Basic states
  const [error, setError] = useState<string | null>(null);
  
  // Progress States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  // Form Field States
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.cover || null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const [autoSlug, setAutoSlug] = useState(initialData?.slug || '');
  const [photos, setPhotos] = useState<string[]>(initialData?.gallery || []);
  
  // Gallery files
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

  // ---- Upload Logic ----
  const uploadFileWithProgress = (file: File, folder: string, onProgress: (loaded: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(e.loaded);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.url);
          } catch {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.open('POST', '/api/upload');
      xhr.send(fd);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    setProgress(0);
    setIsUploading(true);

    try {
      const formElement = e.currentTarget;
      
      // Calculate total bytes to upload out of 90% progress slice
      const totalBytes = 
        (coverFile ? coverFile.size : 0) + 
        newPhotoFiles.reduce((acc, f) => acc + f.size, 0);
      
      let uploadedBytes = 0;
      const updateProgress = (chunkLoaded: number) => {
        if (totalBytes === 0) return;
        const currentTotalLoaded = uploadedBytes + chunkLoaded;
        const uploadPercent = (currentTotalLoaded / totalBytes) * 90; // Upload takes up to 90%
        setProgress(uploadPercent);
      };

      // 1. Upload Cover
      let finalCoverUrl = initialData?.cover || '';
      if (coverFile) {
        setStatusText('กำลังอัปโหลดหน้าปก...');
        finalCoverUrl = await uploadFileWithProgress(coverFile, 'portfolio', (loaded) => updateProgress(loaded));
        uploadedBytes += coverFile.size;
        setProgress((uploadedBytes / totalBytes) * 90);
      } else if (!isEdit) {
        throw new Error('กรุณาเลือกรูปปก');
      }

      // 2. Upload Gallery (Sequential to avoid network flooding)
      const finalGalleryUrls = [...photos];
      for (let i = 0; i < newPhotoFiles.length; i++) {
        const file = newPhotoFiles[i];
        setStatusText(`กำลังอัปโหลดรูปภาพที่ ${i + 1}/${newPhotoFiles.length}...`);
        
        // Wait for retry logic if needed (simplified retry wrapper)
        const uploadWithRetry = async (retries = 3): Promise<string> => {
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              return await uploadFileWithProgress(file, 'portfolio/gallery', (loaded) => updateProgress(loaded));
            } catch (err) {
              if (attempt === retries) throw err;
              await new Promise(res => setTimeout(res, attempt * 1000)); // Exponential-ish backoff
            }
          }
          throw new Error('Failed to upload after max retries');
        };

        const url = await uploadWithRetry();
        finalGalleryUrls.push(url);
        uploadedBytes += file.size;
        setProgress((uploadedBytes / totalBytes) * 90);
      }

      // 3. Save Data via Server Action
      setStatusText('กำลังบันทึกข้อมูลเข้าฐานข้อมูล...');
      setProgress(95);

      const finalFormData = new FormData(formElement);
      finalFormData.set('coverUrl', finalCoverUrl);
      finalFormData.set('galleryUrls', JSON.stringify(finalGalleryUrls));
      // Remove File objects so we don't send huge payloads to the action
      finalFormData.delete('cover');
      finalFormData.delete('photos');

      const result = await action(finalFormData);

      if (result && result.error) {
        throw new Error(result.error);
      }

      setProgress(100);
      setStatusText('บันทึกข้อมูลสำเร็จ!');
      
      setTimeout(() => {
        router.push('/admin/portfolio');
      }, 500);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่คาดคิด');
      }
      setIsSubmitting(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setNewPhotoFiles(prev => [...prev, ...newFiles]);
      const previews = newFiles.map(file => URL.createObjectURL(file));
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
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'กำลังบันทึก...'
            : isEdit
              ? 'อัปเดตข้อมูล'
              : 'สร้างผลงาน'}
        </button>
      </div>

      {/* Progress Modal */}
      <SaveProgress
        isOpen={isSubmitting}
        progress={progress}
        statusText={statusText}
      />
    </form>
  );
}
