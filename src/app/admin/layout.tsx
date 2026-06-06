import { ReactNode } from 'react';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import ToastProvider from '@/components/admin/ToastProvider';
import AdminLayoutShell from './AdminLayoutShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <ToastProvider>
        <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:rounded-lg focus:outline-none">
          ข้ามไปที่เนื้อหาหลัก
        </a>
        <AdminLayoutShell>
          {children}
        </AdminLayoutShell>
      </ToastProvider>
    </AdminSessionProvider>
  );
}
