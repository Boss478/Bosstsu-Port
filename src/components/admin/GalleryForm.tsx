'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import ImageCropper from './ImageCropper';
import TagPicker from './TagPicker';
import { slugify } from '@/lib/format';
import { uploadFileWithProgress, uploadFilesInBatches } from '@/lib/client-upload';
import { useAdminSession } from './AdminSessionProvider';
import { useToast } from './ToastProvider';
import SaveProgress from './SaveProgress';

const PREVIEW_CAP = 20;

interface GalleryFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  portfolios?: { _id: string; title: string }[];
  action: (formData: FormData) => Promise<void | { error?: string; id?: string }>;
  mediaAction: (id: string, formData: FormData) => Promise<void | { error?: string }>;
  isEdit?: boolean;
  incompleteUpload?: boolean;
  availableTags?: string[];
}

export default function GalleryForm({ initialData, portfolios, action, mediaAction, isEdit, incompleteUpload, availableTags = [] }: GalleryFormProps) {
  const router = useRouter();
  const { setIsUploading, onAuthError } = useAdminSession();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.cover || null);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]); // Track File objects for upload
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [croppedCoverBlob, setCroppedCoverBlob] = useState<Blob | null>(null);
  const [previewModalSrc, setPreviewModalSrc] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState(initialData?.slug || '');
  const [excessFiles, setExcessFiles] = useState(0);
  const batchIdRef = useRef(uuidv4());
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach(URL.revokeObjectURL);
    };
  }, []);

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
      textFormData.delete('cover');
      textFormData.delete('photos');
      textFormData.delete('coverUrl');
      textFormData.delete('photoUrls');

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
      const coverFile = croppedCoverBlob ? new File([croppedCoverBlob], 'cover.jpg', { type: 'image/jpeg' }) : null;
      const totalBytes =
        (coverFile ? coverFile.size : 0) +
        newPhotoFiles.reduce((acc, f) => acc + f.size, 0);

      // Size warning
      const totalMB = totalBytes / (1024 * 1024);
      if (totalMB > 500 && !window.confirm(
        `⚠️ ขนาดไฟล์รวม ${totalMB.toFixed(0)} MB (${newPhotoFiles.length} รูป)\n\n` +
        `การอัปโหลดไฟล์ที่มีขนาดใหญ่อาจใช้เวลานาน\nต้องการดำเนินการต่อหรือไม่?`
      )) {
        setIsSubmitting(false);
        setIsUploading(false);
        return;
      }

      let finalCoverUrl = initialData?.cover || '';
      const finalPhotoUrls = [...photos];
      const batchId = batchIdRef.current;

      if (totalBytes > 0) {
        // Upload Cover
        if (coverFile) {
          setStatusText('กำลังอัปโหลดหน้าปก...');
          setProgress(30);
          finalCoverUrl = await uploadFileWithProgress(coverFile, 'gallery', () => {}, signal, batchId);
        }

        // Upload New Photos (Parallel batches of 3)
        if (newPhotoFiles.length > 0) {
          setStatusText(`กำลังอัปโหลดรูปภาพ (0/${newPhotoFiles.length})...`);
          const urls = await uploadFilesInBatches(
            newPhotoFiles, 'gallery',
            (completed, total) => {
              setStatusText(`กำลังอัปโหลดรูปภาพ (${completed}/${total})...`);
              const uploadedBytes = newPhotoFiles.slice(0, completed).reduce((a, f) => a + f.size, 0);
              setProgress(25 + (uploadedBytes / totalBytes) * 65);
            },
            3, signal, batchId
          );
          finalPhotoUrls.push(...urls);
        }

        setProgress(90);
      } else {
        setProgress(90);
      }

      // Phase 3: Save media + publish (always runs)
      setStatusText('กำลังบันทึกข้อมูลเข้าฐานข้อมูล...');
      setProgress(95);

      const mediaFormData = new FormData();
      mediaFormData.set('coverUrl', finalCoverUrl);
      mediaFormData.set('photoUrls', JSON.stringify(finalPhotoUrls));
      const publishedInput = formElement.querySelector<HTMLInputElement>('[name="published"]');
      if (publishedInput?.checked) mediaFormData.set('published', 'on');

      const mediaResult = await mediaAction(itemId, mediaFormData);
      if (mediaResult?.error) throw new Error(mediaResult.error);

      setProgress(100);
      setStatusText('บันทึกข้อมูลสำเร็จ!');
      batchIdRef.current = uuidv4();
      setExcessFiles(0);

      setTimeout(() => {
        router.push('/admin/gallery');
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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (cropImageSrc?.startsWith('blob:')) URL.revokeObjectURL(cropImageSrc);
      const url = URL.createObjectURL(file);
      blobUrlsRef.current.push(url);
      setCropImageSrc(url);
      e.target.value = '';
    }
  };

  const handleCropComplete = (blob: Blob) => {
    setCroppedCoverBlob(blob);
    if (cropImageSrc?.startsWith('blob:')) URL.revokeObjectURL(cropImageSrc);
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    const url = URL.createObjectURL(blob);
    blobUrlsRef.current.push(url);
    setCoverPreview(url);
    setCropImageSrc(null);
  };
  
  const handleCropCancel = () => {
    if (cropImageSrc?.startsWith('blob:')) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setNewPhotoFiles(prev => [...prev, ...fileArray]);
      const excessCount = Math.max(0, fileArray.length - PREVIEW_CAP);
      if (excessCount > 0) {
        setExcessFiles(prev => prev + excessCount);
      }
      const previewFiles = excessCount > 0 ? fileArray.slice(0, PREVIEW_CAP) : fileArray;
      const newPreviews = previewFiles.map(file => {
        const url = URL.createObjectURL(file);
        blobUrlsRef.current.push(url);
        return url;
      });
      setNewPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeExistingPhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews(prev => {
      const url = prev[index];
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      const filtered = prev.filter((_, i) => i !== index);
      if (excessFiles > 0 && filtered.length < PREVIEW_CAP) {
        setExcessFiles(prev => prev - 1);
      }
      return filtered;
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit) {
      setAutoSlug(slugify(e.target.value));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s+/g, '-');
    setAutoSlug(val.toLowerCase());
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {incompleteUpload && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50 text-sm flex items-start gap-3">
            <i aria-hidden="true" className="fi fi-sr-exclamation mt-0.5 flex shrink-0" />
            <span>บันทึกข้อมูลสำเร็จ แต่รูปภาพยังไม่ได้อัปโหลด กรุณาเพิ่มรูปภาพและบันทึกอีกครั้ง</span>
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
            ข้อมูลอัลบั้ม (Album Details)
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ชื่ออัลบั้ม (Title) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                id="title"
                defaultValue={initialData?.title}
                required
                onChange={handleTitleChange}
                placeholder="ทัศนศึกษา Open House 2025"
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                id="slug"
                value={autoSlug}
                onChange={handleSlugChange}
                required
                placeholder="gallery-album-name"
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              รายละเอียด (Description)
            </label>
            <textarea
              name="description"
              id="description"
              defaultValue={initialData?.description}
              rows={3}
              placeholder="คำอธิบายสั้น ๆ เกี่ยวกับเนื้อหา"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="relatedPortfolioId" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              เชื่อมโยงผลงาน (Linked Portfolio)
            </label>
            <div className="relative">
              <select
                name="relatedPortfolioId"
                id="relatedPortfolioId"
                defaultValue={initialData?.relatedPortfolioId || ''}
                className="appearance-none w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">ไม่มี (None)</option>
                {portfolios?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <i aria-hidden="true" className="fi fi-sr-angle-small-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              รูปภาพในอัลบั้ม (Photos)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                  <Image src={photo} alt={`Photo ${index}`} fill sizes="(max-width: 768px) 50vw, 150px" className="object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPreviewModalSrc(photo)}
                      className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-colors"
                      title="ดูรูปขยาย (View Full)"
                    >
                      <i aria-hidden="true" className="fi fi-sr-expand flex" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(index)}
                      className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-md transition-colors"
                      title="ลบรูปนี้ (Remove)"
                    >
                      <i aria-hidden="true" className="fi fi-sr-trash flex" />
                    </button>
                  </div>
                </div>
              ))}
              {newPhotoPreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-500 group">
                  <Image src={preview} alt="New Upload" fill sizes="(max-width: 768px) 50vw, 150px" className="object-cover" />
                  <div className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none z-10">
                    NEW
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModalSrc(preview)}
                      className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-colors"
                      title="ดูรูปขยาย (View Full)"
                    >
                      <i aria-hidden="true" className="fi fi-sr-expand flex" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-md transition-colors"
                      title="ลบรูปนี้ (Remove)"
                    >
                      <i aria-hidden="true" className="fi fi-sr-trash flex" />
                    </button>
                  </div>
                </div>
              ))}

              {excessFiles > 0 && (
                <div className="relative aspect-square rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700 flex items-center justify-center bg-amber-50/50 dark:bg-amber-900/20">
                  <div className="text-center">
                    <i aria-hidden="true" className="fi fi-sr-plus text-xl text-amber-500" />
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                      +{excessFiles} more
                    </p>
                  </div>
                </div>
              )}
              
              <label 
                htmlFor="photos-upload-input"
                className="relative aspect-square rounded-lg border-2 border-dashed border-zinc-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-zinc-50 dark:bg-slate-900"
              >
                <div className="text-center pointer-events-none">
                  <i aria-hidden="true" className="fi fi-sr-add text-2xl text-zinc-400" />
                  <p className="text-xs text-zinc-500 mt-1">เพิ่มรูป</p>
                </div>
              </label>
              <input
                id="photos-upload-input"
                type="file"
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
              รูปปก (Cover Image) <span className="text-red-500">*</span>
            </label>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-slate-900 border-2 border-dashed border-zinc-300 dark:border-slate-700 hover:border-blue-500 transition-colors group">
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
                      <i aria-hidden="true" className="fi fi-sr-expand flex" /> ดูเต็มจอ (View)
                    </button>
                    <label
                      htmlFor="cover-upload-input"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl cursor-pointer transition-colors flex items-center gap-2 text-sm"
                    >
                      <i aria-hidden="true" className="fi fi-sr-pencil flex" /> เปลี่ยนรูป (Change)
                    </label>
                  </div>
                </>
              ) : (
                <label 
                  htmlFor="cover-upload-input"
                  className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 cursor-pointer hover:text-blue-500 transition-colors"
                >
                  <i aria-hidden="true" className="fi fi-sr-add-image text-3xl mb-2" />
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
            <label htmlFor="date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              วันที่ (Date) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              id="date"
              defaultValue={initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'กำลังบันทึก...' : (isEdit ? 'อัปเดตข้อมูล' : 'สร้างอัลบั้ม')}
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

      <SaveProgress
        isOpen={isSubmitting}
        progress={progress}
        statusText={statusText}
        onCancel={() => abortRef.current?.abort()}
      />

      {previewModalSrc && (
        <div 
          className="fixed inset-0 z-150 flex items-center justify-center bg-black/10 p-4 animate-fade-in-up"
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
            <i aria-hidden="true" className="fi fi-sr-cross text-xl flex" />
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
