"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudyEnterPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length === 5) {
      router.push(`/study/${trimmed}`);
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().slice(0, 5))
              }
              placeholder="_ _ _ _ _"
              maxLength={5}
              className="w-full text-center text-3xl font-mono tracking-widest uppercase px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={code.trim().length !== 5}
              className="w-full py-3 rounded-xl font-semibold text-white bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 transition-colors"
            >
              เข้าห้อง
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}