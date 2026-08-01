'use client';

interface Props {
  onClick: () => void;
  title?: string;
  ariaLabel?: string;
}

export default function BackButton({ onClick, title = 'Back', ariaLabel }: Props) {
  return (
    <button
      onClick={onClick}
      className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-colors"
      title={title}
      aria-label={ariaLabel}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>
  );
}
