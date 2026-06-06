'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminSession } from './AdminSessionProvider';
import { useToast } from './ToastProvider';

interface ToggleActiveProps {
  id: string;
  isActive: boolean;
  action: (id: string) => Promise<{ error?: string }>;
}

export default function ToggleActive({ id, isActive, action }: ToggleActiveProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { onAuthError } = useAdminSession();
  const { showToast } = useToast();

  const handleToggle = () => {
    const confirmMessage = isActive
      ? 'ต้องการปิด session นี้ใช่หรือไม่?'
      : 'ต้องการเปิด session นี้ใหม่ใช่หรือไม่?';
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
        isActive
          ? 'bg-emerald-200 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
          : 'bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-slate-600'
      }`}
      title={isActive ? 'คลิกเพื่อปิด session' : 'คลิกเพื่อเปิด session ใหม่'}
    >
      {isPending ? (
        <i aria-hidden="true" className="fi fi-sr-spinner animate-spin text-[8px]" />
      ) : (
        <>
          <i className={`fi ${isActive ? 'fi-sr-signal-stream' : 'fi-sr-stop'}`} />
          {isActive ? 'Active' : 'Ended'}
        </>
      )}
    </button>
  );
}
