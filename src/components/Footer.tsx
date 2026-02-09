import Link from 'next/link';

const socialLinks = [
    { href: 'https://github.com/Boss478', label: 'GitHub', icon: 'fi fi-brands-github' },
    { href: '#', label: 'Facebook', icon: 'fi fi-brands-facebook' },
];

export default function Footer() {
    return (
        <footer className="bg-sky-100 dark:bg-blue-950 border-t border-sky-200 dark:border-blue-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-sky-500 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                B
                            </div>
                            <span className="font-bold text-xl text-sky-600 dark:text-sky-400">
                                Boss478
                            </span>
                        </Link>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                            เว็บไซต์ส่วนตัวสำหรับเก็บผลงาน กิจกรรม และสื่อการเรียนรู้
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">ลิงก์ด่วน</h3>
                        <div className="flex flex-col gap-2">
                            <Link href="/portfolio" className="text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">
                                <i className="fi fi-rr-palette mr-2"></i>ผลงาน
                            </Link>
                            <Link href="/activities" className="text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">
                                <i className="fi fi-rr-calendar mr-2"></i>กิจกรรม
                            </Link>
                            <Link href="/gallery" className="text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">
                                <i className="fi fi-rr-picture mr-2"></i>แกลเลอรี่
                            </Link>
                        </div>
                    </div>

                    {/* Social */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">ติดตาม</h3>
                        <div className="flex gap-3">
                            {socialLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-zinc-800/80 dark:bg-zinc-200/80 flex items-center justify-center hover:bg-violet-100/80 dark:hover:bg-white/20 hover:text-violet-600 dark:text-zinc-200 dark:hover:text-violet-400 border border-white/20 transition-all duration-200"
                                    aria-label={link.label}
                                >
                                    <i className={`${link.icon} text-lg`}></i>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                    <p className="text-zinc-500 dark:text-zinc-500 text-sm">
                        © {new Date().getFullYear()} Boss478. All rights reserved.
                    </p>
                    <p className="text-zinc-400 dark:text-zinc-600 text-xs">
                        Icons by <a href="https://www.flaticon.com/uicons" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 transition-colors">Flaticon Uicons</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
