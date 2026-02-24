import Link from "next/link";
import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-sm transition-all hover:bg-white/60 dark:hover:bg-slate-800/60">
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center text-zinc-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 transition-colors"
          >
            <i className="fi fi-sr-home text-xs" />
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <i className="fi fi-sr-angle-small-right text-[10px] text-zinc-400 dark:text-zinc-500" />
            {item.href ? (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-sky-600 dark:text-zinc-300 dark:hover:text-sky-400 transition-colors"
              >
                {item.icon && <i className={`${item.icon} text-xs`} />}
                {item.label}
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[150px] sm:max-w-[250px]">
                {item.icon && <i className={`${item.icon} text-xs`} />}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
