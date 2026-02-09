import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-sky-50 dark:bg-blue-950">
            {/* Background */}
            <div className="absolute inset-0 bg-sky-100/50 dark:bg-blue-950" />

            {/* Floating Shapes */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-sky-400 rounded-full opacity-20 blur-3xl animate-float" />
            <div
                className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400 rounded-full opacity-20 blur-3xl animate-float"
                style={{ animationDelay: "1s" }}
            />
            <div
                className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-400 rounded-full opacity-20 blur-3xl animate-float"
                style={{ animationDelay: "2s" }}
            />

            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                <div className="mb-8 animate-float">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-sky-500 dark:bg-blue-600 text-white text-6xl font-bold shadow-2xl shadow-sky-500/30 dark:shadow-blue-600/30">
                        B
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6">
                    <span className="text-sky-600 dark:text-sky-400">
                        WELCOME
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 mb-8 max-w-2xl mx-auto">
                    เว็บไซต์สำหรับเก็บความทรงจำของบอสสึ
                    <br />
                    <span className="text-lg text-zinc-500 dark:text-zinc-400">
                        มีทั้งผลงานต่าง ๆ รูปภาพ และสื่อการเรียนรู้ รวมถึงความทรงจำด้วย
                    </span>
                </p>

                <div className="flex flex-wrap gap-4 justify-center">
                    <Link
                        href="/portfolio"
                        className="px-8 py-4 rounded-2xl bg-sky-500 dark:bg-blue-600 text-white font-semibold text-lg hover:bg-sky-600 dark:hover:bg-blue-700 hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-300 hover:-translate-y-1"
                    >
                        ผลงาน
                    </Link>
                    <Link
                        href="/gallery"
                        className="px-8 py-4 rounded-2xl bg-white dark:bg-blue-900 text-zinc-900 dark:text-white font-semibold text-lg border border-sky-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                        สื่อการเรียนรู้
                    </Link>
                </div>
            </div>
        </section>
    );
}
