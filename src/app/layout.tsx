import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../fonts/flaticon-subset.css';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DeviceTierProvider } from '@/lib/device-tier-provider';
import QueryProvider from '@/lib/query/providers';
import { CONFIG } from '@/lib/config';

const geistSans = localFont({
  src: '../fonts/Geist-Variable.woff2',
  variable: '--font-geist-sans',
});

const geistMono = localFont({
  src: '../fonts/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
});

const mali = localFont({
  src: [
    { path: '../fonts/Mali-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Mali-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/Mali-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/Mali-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-mali',
});

// Sarabun — LawLib's Thai law-text font. Registered at the ROOT layout (not
// just the lawlib layout) so `var(--font-sarabun)` resolves on <body> — the
// LawTooltip portal renders into document.body, OUTSIDE the lawlib layout's
// wrapper div, and next/font/local hashes the family name so a literal
// 'Sarabun' fallback would never match. Same multi-weight pattern as Mali.
const sarabun = localFont({
  src: [
    { path: '../fonts/sarabun/Sarabun-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/sarabun/Sarabun-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/sarabun/Sarabun-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/sarabun/Sarabun-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sarabun',
});

export const metadata: Metadata = {
  title: CONFIG.SITE.TITLE,
  description: CONFIG.SITE.DESCRIPTION,
  icons: {
    icon: [
      { url: '/icon/favicon.ico', sizes: 'any' },
      { url: '/icon/icon.png', type: 'image/png' },
    ],
    apple: [{ url: '/icon/apple-icon.png', type: 'image/png', sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* Pre-hydration theme script (P2): apply the stored theme + paper tone
            BEFORE first paint so read-mode has no light flash and dark-mode
            first paint is instant. Mirrors ThemeProvider.getInitialTheme —
            stored value ∈ {light,dark,read} wins, else OS scheme. Guarded:
            no localStorage access on error. Keep suppressHydrationWarning on
            <html> (ThemeProvider re-applies classes on mount). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var c='light';if(t==='light'||t==='dark'||t==='read'){c=t;}else{c=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var h=document.documentElement;h.classList.remove('light','dark','read');h.classList.add(c);var p=localStorage.getItem('lawlib:paperTone');if(p!=='soft'&&p!=='classic'&&p!=='warm'){p='classic';}h.setAttribute('data-paper-tone',p);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mali.variable} ${sarabun.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider>
            <DeviceTierProvider>{children}</DeviceTierProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
