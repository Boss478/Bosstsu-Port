'use client';

import { Component, type ReactNode } from 'react';
import { StockDataProvider, useStockData, PERIOD_CONFIG } from './StockDataContext';
import MarketOverview from './MarketOverview';
import PortfolioTracker from './PortfolioTracker';
import ChartViews from './ChartViews';
import Watchlist from './Watchlist';
import BottomNavBar from './BottomNavBar';

class TabErrorBoundary extends Component<
  { children: ReactNode; tabName: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; tabName: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error(`[${this.props.tabName}] Error:`, error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 rounded-xl border border-red-200/60 dark:border-red-700/50 bg-red-50/60 dark:bg-red-900/30 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Something went wrong in {this.props.tabName}</p>
          <p className="text-xs text-zinc-400 mt-1">Try refreshing the page</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const INTERVAL_OPTIONS = [
  { label: 'Off', value: null },
  { label: '1 min', value: 60_000 },
  { label: '5 min', value: 300_000 },
  { label: '15 min', value: 900_000 },
  { label: '30 min', value: 1_800_000 },
];

const TABS = [
  { id: 'overview' as const, label: 'Overview', icon: 'fi-sr-apps' },
  { id: 'portfolio' as const, label: 'Portfolio', icon: 'fi-sr-briefcase' },
  { id: 'charts' as const, label: 'Charts', icon: 'fi-sr-chart-line-up' },
  { id: 'watchlist' as const, label: 'Watchlist', icon: 'fi-sr-star' },
];

function DashboardInner() {
  const { activeTab, setActiveTab, period, setPeriod, manualRefresh, isLoading, lastUpdated, setRefreshInterval, refreshInterval, failedYahooCalls, marketState } = useStockData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          <i className="fi fi-sr-stats text-blue-500 mr-3" />
          Private Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={manualRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <i className={`fi fi-sr-rotate-left text-sm text-zinc-600 dark:text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <select
            value={refreshInterval ?? ''}
            onChange={e => setRefreshInterval(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
          >
            {INTERVAL_OPTIONS.map(opt => (
              <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
            ))}
          </select>
        </div>
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
          {PERIOD_CONFIG.map(p => (
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
        {lastUpdated && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto whitespace-nowrap">
            Last updated: {lastUpdated.toLocaleString()}
          </span>
        )}
      </div>

      <div className="mb-4 flex gap-3 text-xs">
        <span className={`px-2 py-1 rounded font-medium ${
          marketState.thai.open
            ? 'text-green-600 dark:text-green-400 bg-green-50/60 dark:bg-green-900/30'
            : 'text-zinc-500 dark:text-zinc-400 bg-zinc-100/60 dark:bg-zinc-800/60'
        }`}>
          SET: {marketState.thai.label}
        </span>
        <span className={`px-2 py-1 rounded font-medium ${
          marketState.us.open
            ? 'text-green-600 dark:text-green-400 bg-green-50/60 dark:bg-green-900/30'
            : 'text-zinc-500 dark:text-zinc-400 bg-zinc-100/60 dark:bg-zinc-800/60'
        }`}>
          US: {marketState.us.label}
        </span>
      </div>

      {failedYahooCalls > 0 && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/50 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <i className="fi fi-sr-exclamation text-amber-500" />
          Showing estimated data — Yahoo Finance unavailable ({failedYahooCalls} failed attempt{failedYahooCalls > 1 ? 's' : ''})
        </div>
      )}

      <TabErrorBoundary tabName="Overview">
        {activeTab === 'overview' && <MarketOverview />}
      </TabErrorBoundary>
      <TabErrorBoundary tabName="Portfolio">
        {activeTab === 'portfolio' && <PortfolioTracker />}
      </TabErrorBoundary>
      <TabErrorBoundary tabName="Charts">
        {activeTab === 'charts' && <ChartViews />}
      </TabErrorBoundary>
      <TabErrorBoundary tabName="Watchlist">
        {activeTab === 'watchlist' && <Watchlist />}
      </TabErrorBoundary>

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
