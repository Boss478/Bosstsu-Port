"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudyEnterPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 5) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tools/session?code=${trimmed}`);
      
      if (res.status === 404) {
        setError("ไม่พบห้องเรียน");
      } else if (res.ok) {
        const data = await res.json();
        if (!data.isActive) {
          setError("ห้องเรียนสิ้นสุดแล้ว");
        } else {
          router.push(`/study/${trimmed}`);
        }
      } else {
        setError("เกิดข้อผิดพลาด กรุลาลองใหม่");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุลาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm rounded-2xl p-8 text-center">
          <div className="fi fi-sr-chalkboard-user text-5xl text-sky-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            เข้าสู่ห้องเรียน
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            กรอกรหัสห้องเรียน 5 ตัวอักษร
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
              <i aria-hidden="true" className="fi fi-sr-exclamation" />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().slice(0, 5));
                setError(null);
              }}
              placeholder="_ _ _ _ _"
              maxLength={5}
              className="w-full text-center text-3xl font-mono tracking-widest uppercase px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
              autoFocus
              disabled={loading}
            />
            <button
              type="submit"
              disabled={code.trim().length !== 5 || loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                "เข้าห้อง"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}