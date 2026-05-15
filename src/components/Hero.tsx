import Link from "next/link";
import Image from "next/image";
import { CONFIG } from '@/lib/config';

export default function HeroSection() {
    return (
        <section id="hero-banner" className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-blue-50 dark:bg-slate-950">

            <div className="absolute inset-0 bg-blue-100/50 dark:bg-slate-950" />


            <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400 rounded-full opacity-20 blur-3xl animate-gentle-bounce" />
            <div
                className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400 rounded-full opacity-20 blur-3xl animate-float"
                style={{ animationDelay: "1s" }}
            />
            <div
                className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-400 rounded-full opacity-20 blur-3xl animate-float"
                style={{ animationDelay: "2s" }}
            />


            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                <div className="mb-8 animate-gentle-bounce">
                    <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/30 dark:shadow-blue-600/30">
                        <Image 
                            src="/icon/icon.png" 
                            alt={`${CONFIG.SITE.NAME} Logo`}
                            fill
                            sizes="128px"
                            priority
                            className="object-cover" 
                        />
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-slide-up">
                    <span className="text-blue-600 dark:text-blue-400">
                        WELCOME
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 mb-8 max-w-2xl mx-auto animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
                    เว็บไซต์สำหรับเก็บความทรงจำของบอสสึ
                    <br />
                    <span className="text-lg text-zinc-500 dark:text-zinc-400">
                        มีทั้งผลงานต่าง ๆ รูปภาพ และสื่อการเรียนรู้ รวมถึงความทรงจำด้วย
                    </span>
                </p>

                <div id="hero-cta" className="flex flex-wrap gap-4 justify-center animate-fade-slide-up" style={{ animationDelay: '400ms' }}>
                    <Link
                        href="/portfolio"
                        className="px-8 py-4 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white font-semibold text-lg hover:bg-blue-600 dark:hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1"
                    >
                        ผลงาน
                    </Link>
                    <Link
                        href="/resources"
                        className="px-8 py-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs text-zinc-900 dark:text-zinc-100 font-semibold text-lg border border-blue-200 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                        สื่อการเรียนรู้
                    </Link>
                </div>
            </div>
        </section>
    );
}
