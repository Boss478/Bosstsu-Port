import localFont from 'next/font/local';
import type { Metadata } from 'next';

// FR13 print styles — plain law text only on print (hide toolbar/TOC/panels,
// page break per .krulaw-chapter). Loaded at layout level so print works even
// before the reader client chunk hydrates.
import '@/app/(website)/krulaw/print.css';

// Sarabun — Thai law-text font (Google Fonts, subsetless woff2 per weight;
// each file covers Thai + Latin glyphs). Same multi-weight pattern as root layout's Mali.
// Path: from src/app/(website)/krulaw/ → ../../../fonts/sarabun/ = src/fonts/sarabun/.
const sarabun = localFont({
  src: [
    { path: '../../../fonts/sarabun/Sarabun-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../../fonts/sarabun/Sarabun-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../../fonts/sarabun/Sarabun-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../../fonts/sarabun/Sarabun-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sarabun',
});

export const metadata: Metadata = {
  title: 'KruLAW — อ่านกฎหมาย',
  description:
    'อ่านกฎหมายไทยแบบเข้าใจง่าย ทั้งฉบับ แบ่งเป็นหมวดและมาตรา พร้อมบทนิยาม ประวัติการแก้ไขเพิ่มเติม และการค้นหามาตรา',
};

export default function KrulawLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${sarabun.variable} font-[family-name:var(--font-sarabun)]`}>{children}</div>
  );
}
