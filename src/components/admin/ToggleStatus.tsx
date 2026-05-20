'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminSession } from './AdminSessionProvider';
import { useToast } from './ToastProvider';

interface ToggleStatusProps {
  id: string;
  currentStatus: boolean;
  action: (id: string) => Promise<{ error?: string }>;
}

export default function ToggleStatus({ id, currentStatus, action }: ToggleStatusProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { onAuthError } = useAdminSession();
  const { showToast } = useToast();

  const handleToggle = () => {
    const confirmMessage = currentStatus
      ? 'ต้องการเปลี่ยนสถานะเป็น Draft ใช่หรือไม่?'
      : 'ต้องการเปลี่ยนสถานะเป็น Public ใช่หรือไม่?';
    if (!confirm(confirmMessage)) return;

    startTransition(async () => {
      const result = await action(id);
      if (result?.error) {
        if (result.error.includes('[401]')) {
          onAuthError();
        } else {
          showToast(result.error, 'error');
        }
      } else {
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all hover:scale-105 disabled:opacity-50 cursor-pointer ${
        currentStatus
          ? 'bg-emerald-200 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
          : 'bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-slate-600'
      }`}
      title={currentStatus ? 'คลิกเพื่อเปลี่ยนเป็น Draft' : 'คลิกเพื่อเปลี่ยนเป็น Public'}
    >
      {isPending ? (
        <i className="fi fi-sr-spinner animate-spin text-[8px]" />
      ) : (
        <>
          <i className={`fi ${currentStatus ? 'fi-sr-eye' : 'fi-sr-eye-crossed'}`} />
          {currentStatus ? 'Public' : 'Draft'}
        </>
      )}
    </button>
  );
}
