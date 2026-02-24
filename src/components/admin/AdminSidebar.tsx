'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAdmin } from '@/app/admin/login/actions';
import { useTheme } from '@/components/ThemeProvider';

const navItems = [
  { label: 'ภาพรวม (Dashboard)', href: '/admin', icon: 'fi-sr-apps' },
  { label: 'ผลงาน (Portfolio)', href: '/admin/portfolio', icon: 'fi-sr-briefcase' },
  { label: 'แกลเลอรี (Gallery)', href: '/admin/gallery', icon: 'fi-sr-picture' },
  { label: 'สื่อการเรียนรู้ (Resources)', href: '/admin/learning', icon: 'fi-sr-book-alt' },
  { label: 'เกม (Games)', href: '/admin/games', icon: 'fi-sr-gamepad' },
];

export default function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-r border-sky-100 dark:border-slate-800 z-50">
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-sky-100 dark:border-slate-800">
        <Link 
          href="/admin" 
          className="text-xl font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2"
        >
          <i className="fi fi-sr-shield-check text-sky-600 text-lg" />
          Boss478 <span className="text-zinc-400 text-xs font-medium">Admin</span>
        </Link>
          
        {/* Close Button (Mobile Only) */}
        <button 
          onClick={onClose}
          className="md:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <i className="fi fi-sr-cross text-xs" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-2">
            จัดการข้อมูล (Management)
          </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-sky-50 dark:hover:bg-slate-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <i className={`fi ${item.icon} ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Actions */}
      <div className="p-4 border-t border-sky-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={toggleTheme}
          title={mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          className="p-2 rounded-xl bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors"
          suppressHydrationWarning
        >
          <i suppressHydrationWarning className={`fi ${mounted && theme === 'dark' ? 'fi-sr-sun text-amber-400' : 'fi-sr-moon text-indigo-400'} text-lg flex`} />
        </button>

        <Link
          href="/"
          target="_blank"
          title="เปิดหน้าเว็บ (Website)"
          className="p-2 rounded-xl bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors"
        >
          <i className="fi fi-sr-arrow-up-right text-lg flex" />
        </Link>

        <form action={logoutAdmin}>
          <button
            type="submit"
            title="ออกจากระบบ (Sign Out)"
            className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <i className="fi fi-sr-sign-out-alt text-lg flex" />
          </button>
        </form>
        </div>
      </div>
    </aside>
  );
}
