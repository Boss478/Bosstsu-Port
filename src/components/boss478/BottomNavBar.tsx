'use client';

import { useEffect, useRef, useState } from 'react';
import { useStockData } from './StockDataContext';

interface TabDef {
  id: 'overview' | 'portfolio' | 'charts' | 'watchlist';
  label: string;
  icon: string;
}

export default function BottomNavBar({ tabs }: { tabs: TabDef[] }) {
  const { activeTab, setActiveTab } = useStockData();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorX, setIndicatorX] = useState(0);
  const [indicatorW, setIndicatorW] = useState(0);

  useEffect(() => {
    if (!navRef.current) return;
    const btn = navRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement | null;
    if (!btn) return;
    const cr = navRef.current.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setIndicatorX(br.left - cr.left + (br.width - 20) / 2);
    setIndicatorW(20);
  }, [activeTab]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-white/60 dark:border-slate-700/50 transition-colors duration-500 shadow-lg">
      <div ref={navRef} className="flex items-center justify-around h-16 px-2 relative">
        <div
          className="absolute top-0 h-0.5 bg-blue-500 rounded-full pointer-events-none transition-transform duration-300 ease-out"
          style={{ width: indicatorW, transform: `translateX(${indicatorX}px)` }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors duration-150 transition-transform duration-press active:scale-95 cursor-pointer min-w-0 ${
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
