'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadFileWithProgress } from '@/lib/client-upload';

interface UseFormSubmitOptions {
  action: (formData: FormData) => Promise<void | { error?: string; id?: string }>;
  mediaAction: (id: string, formData: FormData) => Promise<void | { error?: string }>;
  onAuthError?: () => void;
  setIsUploading?: (uploading: boolean) => void;
  onSuccess?: () => void;
}

interface SubmitOptions {
  stripFields?: string[];
  uploadFolders?: Record<string, string>;
  includeMediaFields?: Record<string, string>;
  initialData?: { _id?: string };
}

interface UseFormSubmitReturn {
  submit: (
    formData: FormData,
    fileFields?: Record<string, File | null>,
    options?: SubmitOptions,
  ) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  progress: number;
  statusText: string;
  abortRef: React.MutableRefObject<AbortController | null>;
}

export function useFormSubmit({
  action,
  mediaAction,
  onAuthError,
  setIsUploading,
  onSuccess,
}: UseFormSubmitOptions): UseFormSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const submit = useCallback(async (
    formData: FormData,
    fileFields?: Record<string, File | null>,
    options?: SubmitOptions,
  ) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setError(null);
    setIsSubmitting(true);
    setProgress(0);
    setIsUploading?.(true);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      // Phase 1: Save text to DB
      setStatusText('กำลังบันทึกข้อมูล...');
      setProgress(5);

      const fileFieldKeys = fileFields ? Object.keys(fileFields) : [];
      const stripFieldsSet = new Set([
        ...fileFieldKeys,
        ...(options?.stripFields ?? []),
      ]);

      const textFormData = new FormData();
      for (const [key, value] of formData.entries()) {
        if (!stripFieldsSet.has(key)) {
          textFormData.append(key, value);
        }
      }

      const existingId = options?.initialData?._id;
      const result = await action(textFormData);
      if (result && 'error' in result && result.error) throw new Error(result.error);
      const itemId = existingId || (result && 'id' in result ? (result as { id?: string }).id : undefined);
      if (!itemId) throw new Error('ไม่พบ ID เอกสาร');

      setProgress(25);

      // Phase 2: Upload files
      const uploadedUrls: Record<string, string> = {};
      const fileEntries = fileFields
        ? Object.entries(fileFields).filter(
            (entry): entry is [string, File] => entry[1] !== null,
          )
        : [];

      if (fileEntries.length > 0) {
        const totalBytes = fileEntries.reduce((sum, [, f]) => sum + f.size, 0);
        let cumulativeBytes = 0;

        for (const [fieldName, file] of fileEntries) {
          const folder = options?.uploadFolders?.[fieldName] ?? fieldName;
          setStatusText(`กำลังอัปโหลด${fieldName}...`);

          const url = await uploadFileWithProgress(
            file,
            folder,
            (loaded) => {
              const totalProgress = cumulativeBytes + loaded;
              const ratio = totalBytes > 0 ? totalProgress / totalBytes : 0;
              setProgress(25 + ratio * 65);
            },
            signal,
          );

          uploadedUrls[fieldName] = url;
          cumulativeBytes += file.size;
        }
      }

      setProgress(90);

      // Phase 3: Save media + publish
      setStatusText('กำลังบันทึกข้อมูลเข้าฐานข้อมูล...');
      setProgress(95);

      const mediaFormData = new FormData();
      for (const [fieldName, url] of Object.entries(uploadedUrls)) {
        mediaFormData.set(`${fieldName}Url`, url);
      }

      if (options?.includeMediaFields) {
        for (const [key, value] of Object.entries(options.includeMediaFields)) {
          mediaFormData.set(key, value);
        }
      }

      const mediaResult = await mediaAction(itemId, mediaFormData);
      if (mediaResult && 'error' in mediaResult && mediaResult.error) throw new Error(mediaResult.error);

      setProgress(100);
      setStatusText('บันทึกข้อมูลสำเร็จ!');
      onSuccess?.();

    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('[401]')) {
          onAuthError?.();
          return;
        }
        if (err.message === 'Upload aborted') {
          return;
        }
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่คาดคิด');
      }
    } finally {
      setIsSubmitting(false);
      setIsUploading?.(false);
      isSubmittingRef.current = false;
      abortRef.current = null;
    }
  }, [action, mediaAction, onAuthError, setIsUploading, onSuccess]);

  return {
    submit,
    isSubmitting,
    error,
    progress,
    statusText,
    abortRef,
  };
}
