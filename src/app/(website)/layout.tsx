import Header from "@/components/Header";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const BackToTop = dynamic(() => import("@/components/BackToTop"));

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
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
    </>
  );
}
