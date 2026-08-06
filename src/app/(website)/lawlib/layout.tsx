import localFont from 'next/font/local';
import type { Metadata } from 'next';
import { LawlibGlassVars } from '@/components/LawlibGlassVars';

// FR13 print styles — plain law text only on print (hide toolbar/TOC/panels,
// page break per .lawlib-chapter). Loaded at layout level so print works even
// before the reader client chunk hydrates.
import '@/app/(website)/lawlib/print.css';

// Sarabun — Thai law-text font (Google Fonts, subsetless woff2 per weight;
// each file covers Thai + Latin glyphs). Same multi-weight pattern as root layout's Mali.
// Path: from src/app/(website)/lawlib/ → ../../../fonts/sarabun/ = src/fonts/sarabun/.
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
  title: 'LawLib — อ่านกฎหมาย',
  description:
    'อ่านกฎหมายไทยแบบเข้าใจง่าย ทั้งฉบับ แบ่งเป็นหมวดและมาตรา พร้อมบทนิยาม ประวัติการแก้ไขเพิ่มเติม และการค้นหามาตรา',
};

export default function LawlibLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${sarabun.variable} font-[family-name:var(--font-sarabun)]`}>
      {/* T10b glass slider vars — dock + search chrome on every lawlib page
          (client; re-applies on the settings-changed event). */}
      <LawlibGlassVars />
      {children}
    </div>
  );
}
