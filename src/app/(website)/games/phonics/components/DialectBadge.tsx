"use client";

const dialectColors: Record<string, string> = {
  uk: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  us: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  universal: "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700",
};

export function DialectBadge({ dialect }: { dialect: string }) {
  const label = dialect === "uk" ? "UK" : dialect === "us" ? "US" : "";
  if (!label) return null;
  return (
    <span className={`inline-block text-[7px] font-extrabold px-1 py-[1px] rounded border leading-tight ${dialectColors[dialect] || ""}`}>
      {label}
    </span>
  );
}
