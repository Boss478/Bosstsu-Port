/**
 * Hook for generating URL-friendly slugs from text.
 * Automatically generates slug from title when not in edit mode.
 */

import { useState, useCallback } from 'react';
import { toSlug } from '@/lib/utils';

interface UseSlugOptions {
  initialSlug?: string;
  isEdit?: boolean;
}

interface UseSlugReturn {
  slug: string;
  setSlug: (slug: string) => void;
  handleTitleChange: (title: string) => void;
  handleSlugChange: (slug: string) => void;
}

export function useSlug({ initialSlug = '', isEdit = false }: UseSlugOptions): UseSlugReturn {
  const [slug, setSlug] = useState(initialSlug);

  const handleTitleChange = useCallback((title: string) => {
    if (!isEdit) {
      setSlug(toSlug(title));
    }
  }, [isEdit]);

  const handleSlugChange = useCallback((newSlug: string) => {
    // Replace spaces with hyphens for URL-friendly input
    const sanitized = newSlug.replace(/\s+/g, '-');
    setSlug(sanitized);
  }, []);

  return {
    slug,
    setSlug,
    handleTitleChange,
    handleSlugChange,
  };
}
