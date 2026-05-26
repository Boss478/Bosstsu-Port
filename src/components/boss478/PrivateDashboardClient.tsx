'use client';

import { StockDataProvider, useStockData, type Period } from './StockDataContext';
import MarketOverview from './MarketOverview';
import PortfolioTracker from './PortfolioTracker';
import PriceChart from './PriceChart';
import Watchlist from './Watchlist';
import BottomNavBar from './BottomNavBar';

const PERIODS: { label: string; value: Period }[] = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'all' },
];

const TABS: { id: 'overview' | 'portfolio' | 'charts' | 'watchlist'; label: string; icon: string }[] = [
  { id: 'overview', label: 'ภาพรวม', icon: 'fi-sr-apps' },
  { id: 'portfolio', label: 'พอร์ต', icon: 'fi-sr-briefcase' },
  { id: 'charts', label: 'กราฟ', icon: 'fi-sr-chart-line-up' },
  { id: 'watchlist', label: 'ติดตาม', icon: 'fi-sr-star' },
];

function DashboardInner() {
  const { activeTab, setActiveTab, period, setPeriod } = useStockData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          <i className="fi fi-sr-stats text-blue-500 mr-3" />
          Private Dashboard
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-1 mb-6 p-1 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <i className={`fi ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Period:</span>
        <div className="flex gap-1 p-0.5 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                period === p.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && <MarketOverview />}
      {activeTab === 'portfolio' && <PortfolioTracker />}
      {activeTab === 'charts' && <PriceChart />}
      {activeTab === 'watchlist' && <Watchlist />}

      <BottomNavBar tabs={TABS} />
    </div>
  );
}

export default function PrivateDashboardClient() {
  return (
    <StockDataProvider>
      <DashboardInner />
    </StockDataProvider>
  );
}
