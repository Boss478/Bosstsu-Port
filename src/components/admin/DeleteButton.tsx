'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteButtonProps {
  id: string;
  action: (id: string) => Promise<{ error?: string }>;
}

export default function DeleteButton({ id, action }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('ยืนยันการลบข้อมูลนี้หรือไม่? (Are you sure?)')) return;

    startTransition(async () => {
      const result = await action(id);
      if (result?.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
      title="Delete"
    >
      <i className={`fi ${isPending ? 'fi-sr-spinner animate-spin' : 'fi-sr-trash'}`} />
    </button>
  );
}
