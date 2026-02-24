import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-sky-50 dark:bg-slate-950">
        {children}
      </main>
      <BackToTop />
      <Footer />
    </>
  );
}
