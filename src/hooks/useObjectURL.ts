/**
 * Hook for managing object URLs with automatic cleanup.
 * Prevents memory leaks from unreleased blob URLs.
 */

import { useState, useEffect, useCallback } from 'react';

interface UseObjectURLOptions {
  revokeOnUnmount?: boolean;
}

interface UseObjectURLReturn {
  objectURL: string | null;
  createObjectURL: (file: File | Blob) => string;
  revokeObjectURL: () => void;
}

export function useObjectURL({ revokeOnUnmount = true }: UseObjectURLOptions = {}): UseObjectURLReturn {
  const [objectURL, setObjectURL] = useState<string | null>(null);

  const createObjectURL = useCallback((file: File | Blob): string => {
    // Revoke previous URL if exists to prevent memory leak
    if (objectURL) {
      URL.revokeObjectURL(objectURL);
    }
    const url = URL.createObjectURL(file);
    setObjectURL(url);
    return url;
  }, [objectURL]);

  const revokeObjectURL = useCallback(() => {
    if (objectURL) {
      URL.revokeObjectURL(objectURL);
      setObjectURL(null);
    }
  }, [objectURL]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (revokeOnUnmount && objectURL) {
        URL.revokeObjectURL(objectURL);
      }
    };
  }, [revokeOnUnmount, objectURL]);

  return {
    objectURL,
    createObjectURL,
    revokeObjectURL,
  };
}

/**
 * Hook for managing multiple object URLs with cleanup.
 * Useful for photo galleries with multiple previews.
 */
export function useObjectURLs({ revokeOnUnmount = true }: UseObjectURLOptions = {}) {
  const [objectURLs, setObjectURLs] = useState<string[]>([]);

  const createObjectURLs = useCallback((files: (File | Blob)[]): string[] => {
    const urls = files.map(file => URL.createObjectURL(file));
    setObjectURLs(prev => [...prev, ...urls]);
    return urls;
  }, []);

  const revokeObjectURL = useCallback((url: string) => {
    URL.revokeObjectURL(url);
    setObjectURLs(prev => prev.filter(u => u !== url));
  }, []);

  const revokeAllObjectURLs = useCallback(() => {
    objectURLs.forEach(url => URL.revokeObjectURL(url));
    setObjectURLs([]);
  }, [objectURLs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (revokeOnUnmount) {
        objectURLs.forEach(url => URL.revokeObjectURL(url));
      }
    };
  }, [revokeOnUnmount, objectURLs]);

  return {
    objectURLs,
    createObjectURLs,
    revokeObjectURL,
    revokeAllObjectURLs,
  };
}
