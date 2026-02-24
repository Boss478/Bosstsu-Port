'use client';

import { logoutAdmin } from './login/actions';

export default function LogoutButton() {
  return (
    <form action={logoutAdmin}>
      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200/60 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium transition-all cursor-pointer"
      >
        <i className="fi fi-sr-sign-out-alt text-xs" />
        ออกจากระบบ
      </button>
    </form>
  );
}
