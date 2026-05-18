import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center">
        <i className="fi fi-sr-exclamation text-6xl text-zinc-300 dark:text-zinc-600 block mb-4" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          404 — ไม่พบหน้าที่คุณค้นหา
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          หน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all"
        >
          <i className="fi fi-sr-home" />
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}