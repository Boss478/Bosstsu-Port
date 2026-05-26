'use client';

import { useStockData } from './StockDataContext';

interface TabDef {
  id: 'overview' | 'portfolio' | 'charts' | 'watchlist';
  label: string;
  icon: string;
}

export default function BottomNavBar({ tabs }: { tabs: TabDef[] }) {
  const { activeTab, setActiveTab } = useStockData();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-white/60 dark:border-slate-700/50 shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer min-w-0 ${
              activeTab === tab.id
                ? 'text-blue-500'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            <i className={`fi ${tab.icon} text-lg leading-none`} />
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
