'use client';

import { useState, useRef, useCallback } from 'react';
import { useAdminSession } from '@/components/admin/AdminSessionProvider';
import { v4 as uuidv4 } from 'uuid';

interface UseFormSubmitReturn {
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  progress: number;
  setProgress: (v: number) => void;
  statusText: string;
  setStatusText: (v: string) => void;
  abortRef: React.MutableRefObject<AbortController | null>;
  batchIdRef: React.MutableRefObject<string>;
  beginSubmit: () => AbortSignal;
  endSubmit: () => void;
  handleError: (err: unknown) => string | undefined;
}

export function useFormSubmit(): UseFormSubmitReturn {
  const { setIsUploading, onAuthError } = useAdminSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const batchIdRef = useRef(uuidv4());

  const beginSubmit = useCallback(() => {
    setIsSubmitting(true);
    setProgress(0);
    setStatusText('');
    setIsUploading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    return controller.signal;
  }, [setIsUploading]);

  const endSubmit = useCallback(() => {
    setIsSubmitting(false);
    setProgress(0);
    setStatusText('');
    setIsUploading(false);
    abortRef.current = null;
    batchIdRef.current = uuidv4();
  }, [setIsUploading]);

  const handleError = useCallback(
    (err: unknown) => {
      if (!err) return undefined;
      if (err instanceof Error && err.message === 'Upload aborted') return 'aborted';
      if (err instanceof Error && err.message.includes('[401]')) {
        onAuthError();
        return undefined;
      }
      return err instanceof Error ? err.message : 'Unknown error';
    },
    [onAuthError],
  );

  return {
    isSubmitting,
    setIsSubmitting,
    progress,
    setProgress,
    statusText,
    setStatusText,
    abortRef,
    batchIdRef,
    beginSubmit,
    endSubmit,
    handleError,
  };
}
