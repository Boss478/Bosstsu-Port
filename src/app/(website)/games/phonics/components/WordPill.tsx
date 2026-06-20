"use client";

interface WordPillProps {
  variant?: "default" | "muted" | "inert";
  size?: "sm" | "md" | "lg";
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

const SIZE: Record<string, string> = {
  sm: "px-2 py-1.5",
  md: "px-3 py-1.5",
  lg: "px-3.5 py-1.5",
};

const STYLE: Record<string, string> = {
  default:
    "bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:border-[#C8A44E]",
  muted:
    "bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-700/30 text-slate-600 dark:text-slate-350 hover:bg-[#C8A44E]/10 hover:border-[#C8A44E]",
  inert:
    "bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-700/30 text-slate-500 dark:text-slate-400",
};

const ACTIVE =
  "bg-[#C8A44E] text-white shadow-xs";

const BASE =
  "rounded-full text-[11px] font-extrabold tracking-wide transition-all";

export default function WordPill({
  variant = "default",
  size = "md",
  active = false,
  onClick,
  className = "",
  children,
}: WordPillProps) {
  const classes = `${SIZE[size]} ${BASE} ${active ? ACTIVE : STYLE[variant]} ${className}`.trim();

  if (variant === "inert") {
    return <span className={classes}>{children}</span>;
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {children}
    </button>
  );
}
