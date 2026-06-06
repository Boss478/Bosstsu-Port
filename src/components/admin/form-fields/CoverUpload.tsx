'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CoverUploadProps {
  name: string;
  accept?: string;
  initialImage?: string | null;
  onFileChange: (file: File | null) => void;
  label: string;
  required?: boolean;
  aspectRatio?: string;
}

export default function CoverUpload({
  name,
  accept = 'image/*',
  initialImage,
  onFileChange,
  label,
  required,
  aspectRatio = 'aspect-video',
}: CoverUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialImage ?? null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setPreview(URL.createObjectURL(file));
      onFileChange(file);
    } else {
      onFileChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`relative ${aspectRatio} rounded-xl overflow-hidden bg-zinc-100 dark:bg-slate-900 border-2 border-dashed border-zinc-300 dark:border-slate-700 hover:border-blue-500 transition-colors group`}
      >
        {preview ? (
          <Image src={preview} alt={label} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
            <i aria-hidden="true" className="fi fi-sr-image text-3xl" />
          </div>
        )}
        <input
          type="file"
          name={name}
          id={name}
          accept={accept}
          onChange={handleChange}
          required={required}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
