'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAdmin } from './actions';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAdmin, {});

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="p-8 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 shadow-lg">

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-sky-500 dark:bg-sky-600 flex items-center justify-center text-white mx-auto mb-4">
              <i className="fi fi-sr-lock text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Admin Login
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Backend System
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                รหัสผ่าน (Password)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                placeholder="••••••••••••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
              />
            </div>

            {state?.error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
                <i className="fi fi-sr-exclamation text-red-500 text-sm" />
                <p className="text-red-600 dark:text-red-400 text-sm">{state.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-sky-400 text-white font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <i className="fi fi-sr-sign-in-alt text-sm" />
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-200/50 dark:border-slate-700/50 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <i className="fi fi-sr-arrow-left text-xs" />
              กลับสู่หน้าเว็บไซต์
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
