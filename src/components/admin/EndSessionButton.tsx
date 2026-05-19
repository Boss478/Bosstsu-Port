'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { endSession } from '@/app/admin/tools/actions';
import { useToast } from './ToastProvider';

interface EndSessionButtonProps {
  sessionId: string;
}

export default function EndSessionButton({ sessionId }: EndSessionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  const handleEnd = () => {
    if (!confirm('ต้องการจบเซสชันนี้หรือไม่?')) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('sessionId', sessionId);

      try {
        await endSession(formData);
        showToast('จบเซสชันสำเร็จ');
        router.refresh();
      } catch (error) {
        showToast('เกิดข้อผิดพลาดในการจบเซสชัน', 'error');
      }
    });
  };

  return (
    <button
      onClick={handleEnd}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 font-medium rounded-xl border border-red-200 dark:border-red-800/50 transition-colors disabled:opacity-50"
    >
      <i className={`fi ${isPending ? 'fi-sr-spinner animate-spin' : 'fi-sr-stop'} text-sm`} />
      End
    </button>
  );
}