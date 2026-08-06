'use client';

interface SearchInputProps {
  /** Input id — the sr-only label points here. One instance per page, so the
   *  default is safe unless a page renders multiple search fields. */
  id?: string;
  /** Accessible label — default is LawLib-specific; other pages (resources /
   *  portfolio / gallery) pass their own via this prop. */
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  id = 'lawlib-list-search',
  label = 'ค้นหากฎหมาย',
  value,
  onChange,
  placeholder = 'ค้นหา...',
}: SearchInputProps) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-80">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <i
        aria-hidden="true"
        className="fi fi-sr-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-sm"
      />
      {/* `lawlib-search-field` = read-mode styling hook (globals.css) — the
          TOC jump input + drawer search are separate components. */}
      <input
        id={id}
        type="text"
        inputMode="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="lawlib-search-field w-full pl-10 pr-4 py-2 min-h-11 rounded-full text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-500 text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
      />
    </div>
  );
}
