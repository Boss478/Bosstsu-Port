'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMobileNav from '@/components/admin/AdminMobileNav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <AdminSessionProvider>
      <div className="min-h-screen bg-sky-50 dark:bg-slate-950">
        {!isLoginPage && (
          <>
            <AdminSidebar />
            <AdminMobileNav />
          </>
        )}
        
        {/* Mobile Top Header (Minimal) */}
        {!isLoginPage && (
          <div className="md:hidden h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-sky-100 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-40">
             <span className="font-bold text-lg text-sky-600 dark:text-sky-400">
               Boss478
             </span>
             <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
               A
             </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`${!isLoginPage ? 'md:pl-64' : ''} min-h-screen flex flex-col transition-all duration-300`}>
          {/* 
             Mobile: Add bottom padding for Nav Bar (h-16 = 4rem equivalent)
             Desktop: Standard padding
          */}
          <main className={`flex-1 ${!isLoginPage ? 'p-4 pb-24 md:p-8 md:pb-8' : ''} overflow-x-hidden`}>
            {children}
          </main>
        </div>
      </div>
    </AdminSessionProvider>
  );
}
