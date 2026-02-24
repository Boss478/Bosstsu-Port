'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'ภาพรวม', href: '/admin', icon: 'fi-sr-apps' },
  { label: 'ผลงาน', href: '/admin/portfolio', icon: 'fi-sr-briefcase' },
  { label: 'แกลเลอรี', href: '/admin/gallery', icon: 'fi-sr-picture' },
  { label: 'สื่อฯ', href: '/admin/learning', icon: 'fi-sr-map-marker' },
  { label: 'เกม', href: '/admin/games', icon: 'fi-sr-gamepad' },
];

export default function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-sky-100 dark:border-slate-800 z-50 md:hidden flex justify-around items-center px-2 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive
                ? 'text-sky-600 dark:text-sky-400'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            <i className={`fi ${item.icon} text-xl mb-0.5`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
