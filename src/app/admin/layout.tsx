import { ReactNode } from 'react';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import ToastProvider from '@/components/admin/ToastProvider';
import AdminLayoutShell from './AdminLayoutShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <ToastProvider>
        <AdminLayoutShell>
          {children}
        </AdminLayoutShell>
      </ToastProvider>
    </AdminSessionProvider>
  );
}
