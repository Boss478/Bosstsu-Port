import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../fonts/flaticon-subset.css';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DeviceTierProvider } from '@/lib/device-tier-provider';
import QueryProvider from '@/lib/query/providers';
import { CONFIG } from '@/lib/config';
import { PAPER_TONE_STOPS } from '@/lib/lawlib/paper-tone';

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
  // Canonical origin — relative alternates.canonical / og URLs resolve against
  // this (without it they'd bake http://localhost:PORT into static HTML).
  metadataBase: new URL(CONFIG.SITE.URL),
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
            stored value ∈ {light,dark,read,sepia} wins; the removed 'night'
            MIGRATES to 'dark' (user decision 2026-08-06); else OS scheme.
            Paper tone: number 0-100 (legacy 'soft'/'classic'/'warm' → 30/50/80)
            → --read-bg/--read-card inline vars (ADR-019 D8). The stops array
            is embedded at BUILD time from lib/lawlib/paper-tone.ts — keep the
            lerp here in sync with paperToneVars there. Guarded: no
            localStorage access on error. Keep suppressHydrationWarning on
            <html> (ThemeProvider re-applies classes on mount).
            T42 (ADR-025 D2): ALSO sets data-motion on <html> BEFORE first
            paint — reads lawlib:settings.motionPreference (whitelist, invalid
            → 'quality') and downgrades quality → 'fast' under OS
            prefers-reduced-motion (user-locked D2c; mirrors
            effectiveMotionPreference in useReaderStorage — keep in sync).
            No attr = quality (the CSS :root factor defaults to 1). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var c='light';if(t==='night'){c='dark';}else if(t==='light'||t==='dark'||t==='read'||t==='sepia'){c=t;}else{c=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var h=document.documentElement;h.classList.remove('light','dark','read','sepia','night');h.classList.add(c);var p=localStorage.getItem('lawlib:paperTone');var x=50;if(p==='soft'){x=30;}else if(p==='classic'){x=50;}else if(p==='warm'){x=80;}else{var n=parseFloat(p);if(!isNaN(n)&&n>=0&&n<=100){x=n;}}var S=${JSON.stringify(PAPER_TONE_STOPS)};if(x<0){x=0;}if(x>100){x=100;}var i=0;while(i<S.length-2&&x>S[i+1][0]){i++;}var a=S[i],b=S[i+1],f=(b[0]-a[0]===0)?0:(x-a[0])/(b[0]-a[0]);var L=function(u,v){return Math.round(u+(v-u)*f);};h.style.setProperty('--read-bg','rgb('+L(a[1],b[1])+','+L(a[2],b[2])+','+L(a[3],b[3])+')');h.style.setProperty('--read-card','rgb('+L(a[4],b[4])+','+L(a[5],b[5])+','+L(a[6],b[6])+')');var m='quality';var s=localStorage.getItem('lawlib:settings');if(s){var o=JSON.parse(s);if(o&&(o.motionPreference==='quality'||o.motionPreference==='fast'||o.motionPreference==='disable')){m=o.motionPreference;}}if(m==='quality'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){m='fast';}h.setAttribute('data-motion',m);}catch(e){}})();`,
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
