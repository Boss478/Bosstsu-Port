'use client';

import SaveProgress from '../SaveProgress';

interface SaveProgressWrapperProps {
  isSaving: boolean;
  progress: number;
  statusText?: string;
  onCancel?: () => void;
}

export default function SaveProgressWrapper({
  isSaving,
  progress,
  statusText = '',
  onCancel,
}: SaveProgressWrapperProps) {
  return (
    <SaveProgress
      isOpen={isSaving}
      progress={progress}
      statusText={statusText}
      onCancel={onCancel}
    />
  );
}
