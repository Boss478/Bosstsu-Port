'use client';

interface Props {
  onScrollDown: () => void;
  roundedBottom?: boolean;
}

export default function ScrollHint({ onScrollDown, roundedBottom }: Props) {
  return (
    <div
      className={`absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white dark:from-zinc-900 via-white/70 dark:via-zinc-900/70 to-transparent pointer-events-none flex items-end justify-center pb-3 z-10 ${
        roundedBottom ? 'rounded-b-[2.5rem]' : ''
      }`}
    >
      <button
        type="button"
        onClick={onScrollDown}
        aria-label="Scroll down for more"
        className="pointer-events-auto flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95"
      >
        <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400">
          Scroll for more ▼
        </span>
        <span className="text-2xl animate-bounce">👇</span>
      </button>
    </div>
  );
}
