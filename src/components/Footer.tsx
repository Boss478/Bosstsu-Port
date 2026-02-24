import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer id="site-footer" className="bg-sky-100 dark:bg-slate-900 border-t border-white/80 dark:border-slate-800">
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
                            <span className="font-bold text-xl text-sky-600 dark:text-sky-400">
                                Boss478
                            </span>
                        </Link>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                            เว็บไซต์ส่วนตัวสำหรับเก็บผลงาน กิจกรรม และสื่อการเรียนรู้
                        </p>
                    </div>


                    <div className="space-y-4">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">ติดต่อ (Contact)</h3>
                        <div className="flex flex-col gap-2">
                            <a href="mailto:boss478@example.com" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm">
                                <i className="fi fi-sr-envelope mr-2"></i>Email: test@test.com
                            </a>
                            <a href="https://github.com/Boss478" target="_blank" rel="noopener noreferrer" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm">
                                <i className="fi fi-brands-github mr-2"></i>GitHub: Boss478
                            </a>
                        </div>
                    </div>
                </div>


                <div id="footer-copyright" className="mt-12 pt-8 border-t border-zinc-200 dark:border-slate-800 text-center space-y-2">
                    <p className="text-zinc-500 dark:text-zinc-500 text-sm">
                        © {new Date().getFullYear()} Boss478. All rights reserved.
                    </p>
                    <p className="text-zinc-400 dark:text-zinc-600 text-xs">
                        Icons by <a href="https://www.flaticon.com/uicons" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 transition-colors">Flaticon Uicons</a>
                        <span className="mx-2">·</span>
                        <Link href="/admin" className="text-zinc-400 dark:text-zinc-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors" aria-label="Admin">
                            <i className="fi fi-sr-settings text-xs" />
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}
