export default function StandaloneLayout({
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
      <main id="main-content" className="min-h-dvh">
        {children}
      </main>
    </>
  );
}
