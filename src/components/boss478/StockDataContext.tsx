'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  startTransition,
  type ReactNode,
} from 'react';
import { useQueryClient, useQueries } from '@tanstack/react-query';
import {
  useStockQuotes,
  useHoldings,
  useWatchlist,
  useAddHolding,
  useRemoveHolding,
  useUpdateWatchlist,
  type ExtendedStockData,
  type StockHistory,
  type PortfolioHolding,
  type MarketIndex,
  type Period,
} from '@/hooks/use-stocks';
import { stockKeys } from '@/lib/query/keys';

export type { ExtendedStockData, StockHistory, PortfolioHolding, MarketIndex, Period };
export type TabId = 'overview' | 'portfolio' | 'charts' | 'watchlist';

export interface PeriodConfig {
  value: Period;
  label: string;
  days: number;
  yahooRange: string;
  yahooInterval: string;
}

export const PERIOD_CONFIG: PeriodConfig[] = [
  { value: '1d', label: '1D', days: 1, yahooRange: '1d', yahooInterval: '5m' },
  { value: '5d', label: '5D', days: 5, yahooRange: '5d', yahooInterval: '30m' },
  { value: '1w', label: '1W', days: 7, yahooRange: '5d', yahooInterval: '30m' },
  { value: '1m', label: '1M', days: 30, yahooRange: '1mo', yahooInterval: '1d' },
  { value: '3m', label: '3M', days: 90, yahooRange: '3mo', yahooInterval: '1d' },
  { value: '6m', label: '6M', days: 180, yahooRange: '6mo', yahooInterval: '1d' },
  { value: 'ytd', label: 'YTD', days: 180, yahooRange: 'ytd', yahooInterval: '1wk' },
  { value: '1y', label: '1Y', days: 365, yahooRange: '1y', yahooInterval: '1wk' },
  { value: '5y', label: '5Y', days: 1825, yahooRange: '5y', yahooInterval: '1mo' },
  { value: 'all', label: 'Max', days: 3650, yahooRange: 'max', yahooInterval: '1mo' },
];

interface StockDataContextValue {
  stocks: ExtendedStockData[];
  indexes: MarketIndex[];
  portfolio: PortfolioHolding[];
  history: Record<string, StockHistory[]>;
  watchlist: string[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  updateHolding: (symbol: string, updates: Partial<Omit<PortfolioHolding, 'symbol'>>) => void;
  addHolding: (
    symbol: string,
    shares: number,
    avgCost: number,
    manualPrice?: number,
  ) => Promise<boolean>;
  removeHolding: (symbol: string) => Promise<boolean>;
  marketState: { thai: { open: boolean; label: string }; us: { open: boolean; label: string } };
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  period: Period;
  setPeriod: (p: Period) => void;
  refreshData: () => Promise<void>;
  manualRefresh: () => Promise<void>;
  isLoading: boolean;
  lastUpdated: Date | null;
  refreshInterval: number | null;
  setRefreshInterval: (ms: number | null) => void;
  failedYahooCalls: number;
}

const StockDataContext = createContext<StockDataContextValue | null>(null);

const THAI_SYMBOLS = [
  'PTT.BK',
  'AOT.BK',
  'CPALL.BK',
  'ADVANC.BK',
  'KBANK.BK',
  'PTTEP.BK',
  'SCB.BK',
  'BBL.BK',
  'BDMS.BK',
  'BH.BK',
  'GULF.BK',
  'INTUCH.BK',
  'TRUE.BK',
  'OR.BK',
  'MINT.BK',
  'CRC.BK',
  'CPN.BK',
  'KTB.BK',
  'TISCO.BK',
  'HMPRO.BK',
];

const US_SYMBOLS = ['TSM', 'GOOGL', 'NVDA', 'AAPL', 'MSFT', 'META', 'AMD'];
const DEFAULT_SYMBOLS = [...THAI_SYMBOLS, ...US_SYMBOLS];

function filterMarketHours(data: StockHistory[], isThai = false): StockHistory[] {
  return data.filter((d) => {
    const dt = new Date(d.date);
    const m = dt.getUTCHours() * 60 + dt.getUTCMinutes();
    if (isThai) return m >= 3 * 60 && m < 9 * 60 + 30;
    return m >= 13 * 60 + 30 && m < 20 * 60;
  });
}

export function StockDataProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [period, setPeriod] = useState<Period>('1m');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [marketClock, setMarketClock] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setMarketClock(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const {
    data: quotesData,
    isLoading: quotesLoading,
    isFetching,
  } = useStockQuotes(DEFAULT_SYMBOLS, refreshInterval ?? false);
  const { data: holdingsData, isLoading: holdingsLoading } = useHoldings();
  const { data: watchlistData, isLoading: watchlistLoading } = useWatchlist();
  const addHoldingMutation = useAddHolding();
  const removeHoldingMutation = useRemoveHolding();
  const updateWatchlistMutation = useUpdateWatchlist();

  const stocks = useMemo(() => quotesData?.quotes ?? [], [quotesData?.quotes]);
  const indexes = quotesData?.indices ?? [];
  const portfolio = useMemo(() => holdingsData ?? [], [holdingsData]);
  const watchlist = useMemo(() => watchlistData ?? [], [watchlistData]);

  useEffect(() => {
    if (!quotesLoading && !isFetching) {
      startTransition(() => setLastUpdated(new Date()));
    }
  }, [quotesLoading, isFetching]);

  const marketState = useMemo(() => {
    const now = new Date(marketClock);
    const utcM = now.getUTCHours() * 60 + now.getUTCMinutes();
    const day = now.getUTCDay();
    const weekday = day >= 1 && day <= 5;
    const thaiOpen = weekday && utcM >= 3 * 60 && utcM < 9 * 60 + 30;
    const usOpen = weekday && utcM >= 13 * 60 + 30 && utcM < 20 * 60;
    return {
      thai: { open: thaiOpen, label: thaiOpen ? 'Open' : 'Closed' },
      us: { open: usOpen, label: usOpen ? 'Open' : 'Closed' },
    };
  }, [marketClock]);

  const historyQueries = useQueries({
    queries: stocks.map((stock) => ({
      queryKey: stockKeys.history(stock.symbol, period),
      queryFn: async () => {
        const res = await fetch('/api/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'history', symbol: stock.symbol, period }),
        });
        if (!res.ok) throw new Error('Failed to fetch history');
        const json = await res.json();
        return (json.history || []) as StockHistory[];
      },
      staleTime: period === '1d' || period === '5d' ? 5 * 60_000 : 60 * 60_000,
    })),
  });

  const history = useMemo(() => {
    const h: Record<string, StockHistory[]> = {};
    for (let i = 0; i < stocks.length; i++) {
      const data = historyQueries[i]?.data;
      if (data?.length) {
        const isThai = stocks[i].symbol.endsWith('.BK');
        const filtered = period === '1d' ? filterMarketHours(data, isThai) : data;
        if (filtered.length >= 2) {
          h[stocks[i].symbol] = filtered;
        }
      }
    }
    return h;
  }, [historyQueries, stocks, period]);

  const isLoading = quotesLoading || holdingsLoading || watchlistLoading;

  const updateHolding = useCallback(
    (symbol: string, updates: Partial<Omit<PortfolioHolding, 'symbol'>>) => {
      const existing = portfolio.find((h) => h.symbol === symbol);
      addHoldingMutation.mutate({
        symbol,
        shares: (updates.shares ?? existing?.shares)!,
        avgCost: (updates.avgCost ?? existing?.avgCost)!,
        manualPrice: updates.manualPrice ?? existing?.manualPrice,
      });
    },
    [portfolio, addHoldingMutation],
  );

  const addHolding = useCallback(
    async (
      symbol: string,
      shares: number,
      avgCost: number,
      manualPrice?: number,
    ): Promise<boolean> => {
      try {
        await addHoldingMutation.mutateAsync({ symbol, shares, avgCost, manualPrice });
        return true;
      } catch {
        return false;
      }
    },
    [addHoldingMutation],
  );

  const removeHolding = useCallback(
    async (symbol: string): Promise<boolean> => {
      try {
        await removeHoldingMutation.mutateAsync(symbol);
        return true;
      } catch {
        return false;
      }
    },
    [removeHoldingMutation],
  );

  const addToWatchlist = useCallback(
    (symbol: string) => {
      const next = watchlist.includes(symbol) ? watchlist : [...watchlist, symbol];
      updateWatchlistMutation.mutate(next);
    },
    [watchlist, updateWatchlistMutation],
  );

  const removeFromWatchlist = useCallback(
    (symbol: string) => {
      const next = watchlist.filter((s) => s !== symbol);
      updateWatchlistMutation.mutate(next);
    },
    [watchlist, updateWatchlistMutation],
  );

  const refreshData = useCallback(async (): Promise<void> => {
    await qc.invalidateQueries({ queryKey: stockKeys.all });
  }, [qc]);

  const manualRefresh = useCallback(async (): Promise<void> => {
    await qc.refetchQueries({ queryKey: stockKeys.all });
  }, [qc]);

  return (
    <StockDataContext.Provider
      value={{
        stocks,
        indexes,
        portfolio,
        history,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        updateHolding,
        addHolding,
        removeHolding,
        marketState,
        activeTab,
        setActiveTab,
        period,
        setPeriod,
        refreshData,
        manualRefresh,
        isLoading,
        lastUpdated,
        refreshInterval,
        setRefreshInterval,
        failedYahooCalls: 0,
      }}
    >
      {children}
    </StockDataContext.Provider>
  );
}

export function useStockData() {
  const ctx = useContext(StockDataContext);
  if (!ctx) throw new Error('useStockData must be used within StockDataProvider');
  return ctx;
}
