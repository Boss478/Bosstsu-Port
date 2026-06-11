import Header from '@/components/Header';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import { AnalyticsProvider } from '@/lib/analytics';
import CookieConsentBanner from '@/components/CookieConsentBanner';

const BackToTop = dynamic(() => import('@/components/BackToTop'));

const DISABLE_ANALYTICS = !!process.env.NEXT_PUBLIC_DISABLE_ANALYTICS;

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const inner = (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-blue-500 focus:text-white focus:shadow-lg focus:outline-none"
      >
        ข้ามไปที่เนื้อหาหลัก
      </a>
      <Header />
      <main id="main-content" className="min-h-screen bg-blue-50 dark:bg-slate-950">
        {children}
      </main>
      <BackToTop />
      <Footer />
      <CookieConsentBanner />
    </>
  );

  return DISABLE_ANALYTICS ? inner : <AnalyticsProvider>{inner}</AnalyticsProvider>;
}
