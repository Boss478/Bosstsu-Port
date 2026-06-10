import Link from 'next/link';
import Image from 'next/image';
import { CONFIG } from '@/lib/config';

export default function Footer() {
  return (
    <footer
      id="site-footer"
      className="bg-blue-100 dark:bg-slate-900 border-t border-white/80 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <Image
                  src="/icon/icon.png"
                  alt="Boss478 Logo"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-xl text-blue-600 dark:text-blue-400">Boss478</span>
            </Link>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              เว็บไซต์ส่วนตัวสำหรับเก็บผลงาน กิจกรรม และสื่อการเรียนรู้
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-white">ติดต่อ (Contact)</h3>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:BossNT45@gmail.com"
                className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                <i aria-hidden="true" className="fi fi-sr-envelope mr-2"></i>Email:
                BossNT45@gmail.com
              </a>
              <a
                href="https://github.com/Boss478"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                <svg
                  className="inline-block w-4 h-4 mr-2 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub: Boss478
              </a>
            </div>
          </div>
        </div>

        <div
          id="footer-copyright"
          className="mt-12 pt-8 border-t border-zinc-200 dark:border-slate-800 text-center space-y-2"
        >
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">
            © {new Date().getFullYear()} Boss478. All rights reserved.
          </p>
          <p className="text-zinc-400 dark:text-zinc-600 text-xs flex items-center justify-center gap-2">
            <span>
              Icons by{' '}
              <a
                href="https://www.flaticon.com/uicons"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Flaticon Uicons
              </a>
            </span>
            <span>·</span>
            <span>v{CONFIG.SITE.VERSION}</span>
            <span>·</span>
            <Link
              href="/cookie-policy"
              className="text-zinc-400 dark:text-zinc-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors text-xs"
            >
              Cookie Policy
            </Link>
            <span>·</span>
            <Link
              href="/admin"
              className="text-zinc-400 dark:text-zinc-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              aria-label="Admin"
            >
              <i aria-hidden="true" className="fi fi-sr-settings text-xs mt-1" />
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
