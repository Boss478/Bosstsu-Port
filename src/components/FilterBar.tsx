'use client';

interface FilterBarProps {
  allItems: string[];
  activeItem: string;
  sort: string;
  onFilter: (item: string, sort: string) => void;
  labelTransform?: (item: string) => string;
}

export default function FilterBar({
  allItems,
  activeItem,
  sort,
  onFilter,
  labelTransform,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
      {allItems.map((item) => (
        <button
          key={item}
          onClick={() => onFilter(item, sort)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-transform duration-press active:scale-95 border ${
            activeItem === item
              ? 'bg-blue-500/85 text-white shadow-md shadow-blue-500/25 backdrop-blur-xs border-white/60'
              : 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-300 hover:bg-blue-100 dark:hover:bg-slate-700'
          }`}
        >
          {labelTransform ? labelTransform(item) : item}
        </button>
      ))}
    </div>
  );
}
