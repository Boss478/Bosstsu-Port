import type { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Boss478Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-blue-50 dark:bg-slate-950 pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
