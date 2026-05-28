'use client';

import { createContext, useContext, useState, useMemo, useRef, useCallback, useEffect, type ReactNode } from 'react';

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
}

export interface ExtendedStockData extends StockData {
  open: number;
  previousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  peRatio: number;
  dividendYield: number;
  dividendAmount: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  currency: string;
}

export interface StockHistory {
  date: string;
  price: number;
  volume: number;
}

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  avgCost: number;
  manualPrice?: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export type Period = '1d' | '5d' | '1w' | '1m' | '3m' | '6m' | 'ytd' | '1y' | '5y' | 'all';

export type TabId = 'overview' | 'portfolio' | 'charts' | 'watchlist';

export interface PeriodConfig {
  value: Period;
  label: string;
  days: number;
  yahooRange: string;
  yahooInterval: string;
}

export const PERIOD_CONFIG: PeriodConfig[] = [
  { value: '1d',  label: '1D',  days: 1,    yahooRange: '1d',  yahooInterval: '5m' },
  { value: '5d',  label: '5D',  days: 5,    yahooRange: '5d',  yahooInterval: '30m' },
  { value: '1w',  label: '1W',  days: 7,    yahooRange: '5d',  yahooInterval: '30m' },
  { value: '1m',  label: '1M',  days: 30,   yahooRange: '1mo', yahooInterval: '1d' },
  { value: '3m',  label: '3M',  days: 90,   yahooRange: '3mo', yahooInterval: '1d' },
  { value: '6m',  label: '6M',  days: 180,  yahooRange: '6mo', yahooInterval: '1d' },
  { value: 'ytd', label: 'YTD', days: 180,  yahooRange: 'ytd', yahooInterval: '1wk' },
  { value: '1y',  label: '1Y',  days: 365,  yahooRange: '1y',  yahooInterval: '1wk' },
  { value: '5y',  label: '5Y',  days: 1825, yahooRange: '5y',  yahooInterval: '1mo' },
  { value: 'all', label: 'Max', days: 3650, yahooRange: 'max', yahooInterval: '1mo' },
];

interface HistoryCacheEntry {
  data: StockHistory[];
  fetchedAt: number;
}

const CACHE_TTL: Record<string, number> = {
  '1d': 5 * 60_000,
  '5d': 5 * 60_000,
  default: 60 * 60_000,
};

interface StockDataContextValue {
  stocks: ExtendedStockData[];
  indexes: MarketIndex[];
  portfolio: PortfolioHolding[];
  history: Record<string, StockHistory[]>;
  watchlist: string[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  updateHolding: (symbol: string, updates: Partial<Omit<PortfolioHolding, 'symbol'>>) => void;
  addHolding: (symbol: string, shares: number, avgCost: number, manualPrice?: number) => Promise<boolean>;
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
  'PTT.BK', 'AOT.BK', 'CPALL.BK', 'ADVANC.BK', 'KBANK.BK',
  'PTTEP.BK', 'SCB.BK', 'BBL.BK', 'BDMS.BK', 'BH.BK',
  'GULF.BK', 'INTUCH.BK', 'TRUE.BK', 'OR.BK', 'MINT.BK',
  'CRC.BK', 'CPN.BK', 'KTB.BK', 'TISCO.BK', 'HMPRO.BK',
];

const US_SYMBOLS = ['TSM', 'GOOGL', 'NVDA', 'AAPL', 'MSFT', 'META', 'AMD'];

const DEFAULT_SYMBOLS = [...THAI_SYMBOLS, ...US_SYMBOLS];

const MOCK_PORTFOLIO: PortfolioHolding[] = [
  { symbol: 'CPN.BK', shares: 1, avgCost: 65.00 },
];

export function StockDataProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [period, setPeriod] = useState<Period>('1m');
  const [watchlist, setWatchlist] = useState<string[]>(['PTT.BK', 'AOT.BK', 'CPALL.BK', 'AAPL', 'MSFT']);
  const [stocks, setStocks] = useState<ExtendedStockData[]>([]);
  const [indexes, setIndexes] = useState<MarketIndex[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [failedYahooCalls, setFailedYahooCalls] = useState(0);

  const [marketClock, setMarketClock] = useState(Date.now());

  const [historyCacheVersion, setHistoryCacheVersion] = useState(0);
  const historyCache = useRef<Map<string, HistoryCacheEntry>>(new Map());
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const stocksRef = useRef(stocks);
  const failedCallsRef = useRef(0);

  stocksRef.current = stocks;
  failedCallsRef.current = failedYahooCalls;

  useEffect(() => {
    const id = setInterval(() => setMarketClock(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  const updateHolding = useCallback((symbol: string, updates: Partial<Omit<PortfolioHolding, 'symbol'>>) => {
    setPortfolio(prev => prev.map(h => h.symbol === symbol ? { ...h, ...updates } : h));
    fetch('/boss478/api/holdings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, ...updates }),
    }).catch(() => {});
  }, []);

  const [holdingsLoaded, setHoldingsLoaded] = useState(false);

  const addHolding = useCallback(async (symbol: string, shares: number, avgCost: number, manualPrice?: number): Promise<boolean> => {
    try {
      const res = await fetch('/boss478/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, shares, avgCost, manualPrice }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.holding) {
        setPortfolio(prev => {
          const exists = prev.find(h => h.symbol === symbol.toUpperCase());
          if (exists) return prev.map(h => h.symbol === symbol.toUpperCase() ? { ...h, shares, avgCost, manualPrice } : h);
          return [...prev, { symbol: symbol.toUpperCase(), shares, avgCost, manualPrice }];
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const removeHolding = useCallback(async (symbol: string): Promise<boolean> => {
    try {
      const res = await fetch('/boss478/api/holdings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) return false;
      setPortfolio(prev => prev.filter(h => h.symbol !== symbol.toUpperCase()));
      return true;
    } catch {
      return false;
    }
  }, []);

  const doActualRefresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quotes', symbols: DEFAULT_SYMBOLS }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.quotes?.length) {
        setStocks(data.quotes);
        setFailedYahooCalls(0);
        failedCallsRef.current = 0;
      } else {
        throw new Error('empty quotes');
      }
      if (data.indices?.length) {
        setIndexes(data.indices);
      }
    } catch {
      const newFailCount = failedCallsRef.current + 1;
      setFailedYahooCalls(newFailCount);
      failedCallsRef.current = newFailCount;
      console.warn('[StockData] quotes fetch failed');
    } finally {
      setLastUpdated(new Date());
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async (): Promise<void> => {
    if (failedCallsRef.current >= 10) return;
    if (refreshPromiseRef.current) return refreshPromiseRef.current;
    refreshPromiseRef.current = doActualRefresh().finally(() => {
      refreshPromiseRef.current = null;
    });
    return refreshPromiseRef.current;
  }, [doActualRefresh]);

  const manualRefresh = useCallback(async (): Promise<void> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;
    setFailedYahooCalls(0);
    failedCallsRef.current = 0;
    refreshPromiseRef.current = doActualRefresh().finally(() => {
      refreshPromiseRef.current = null;
    });
    return refreshPromiseRef.current;
  }, [doActualRefresh]);

  useEffect(() => {
    if (!refreshInterval) return;
    let effectiveInterval = refreshInterval;
    if (failedCallsRef.current >= 3 && failedCallsRef.current < 10) {
      effectiveInterval = refreshInterval * Math.pow(2, failedCallsRef.current - 2);
      effectiveInterval = Math.min(effectiveInterval, 30 * 60_000);
    }
    const id = setInterval(() => refreshData(), effectiveInterval);
    return () => clearInterval(id);
  }, [refreshInterval, refreshData, failedYahooCalls]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (holdingsLoaded) return;
    fetch('/boss478/api/holdings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setHoldingsLoaded(true);
        if (data?.holdings?.length) {
          setPortfolio(data.holdings);
        } else {
          setPortfolio(MOCK_PORTFOLIO);
        }
      })
      .catch(() => {
        setHoldingsLoaded(true);
        setPortfolio(MOCK_PORTFOLIO);
      });
  }, [holdingsLoaded]);

  const [watchlistLoaded, setWatchlistLoaded] = useState(false);

  useEffect(() => {
    if (watchlistLoaded) return;
    fetch('/boss478/api/watchlist')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setWatchlistLoaded(true);
        if (data?.symbols?.length) {
          setWatchlist(data.symbols);
        }
      })
      .catch(() => setWatchlistLoaded(true));
  }, [watchlistLoaded]);

  const persistWatchlist = useCallback((symbols: string[]) => {
    fetch('/boss478/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    }).catch(() => {});
  }, []);

  const addToWatchlist = (symbol: string) => {
    setWatchlist(prev => {
      const next = prev.includes(symbol) ? prev : [...prev, symbol];
      persistWatchlist(next);
      return next;
    });
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => {
      const next = prev.filter(s => s !== symbol);
      persistWatchlist(next);
      return next;
    });
  };

function filterMarketHours(data: StockHistory[], isThai = false): StockHistory[] {
  return data.filter(d => {
    const dt = new Date(d.date);
    const m = dt.getUTCHours() * 60 + dt.getUTCMinutes();
    if (isThai) {
      return m >= 3 * 60 && m < 9 * 60 + 30;
    }
    return m >= 13 * 60 + 30 && m < 20 * 60;
  });
}

const history = useMemo(() => {
  const h: Record<string, StockHistory[]> = {};
  const currentStocks = stocksRef.current;

  for (const stock of currentStocks) {
    const cacheKey = `${stock.symbol}_${period}`;
    const cached = historyCache.current.get(cacheKey);
    const ttl = CACHE_TTL[period] || CACHE_TTL.default;

    if (cached && Date.now() - cached.fetchedAt < ttl) {
      const isThai = stock.symbol.endsWith('.BK');
      const data = period === '1d' ? filterMarketHours(cached.data, isThai) : cached.data;
      if (data.length >= 2) {
        h[stock.symbol] = data;
      }
    }
  }

  return h;
}, [period, historyCacheVersion]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const config = PERIOD_CONFIG.find(p => p.value === period);
    if (!config) return;

    for (const stock of stocksRef.current) {
      const cacheKey = `${stock.symbol}_${period}`;
      const cached = historyCache.current.get(cacheKey);
      const ttl = CACHE_TTL[period] || CACHE_TTL.default;
      if (cached && Date.now() - cached.fetchedAt < ttl) continue;

      fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'history', symbol: stock.symbol, period }),
      }).then(res => res.json()).then(data => {
        if (data.history?.length) {
          historyCache.current.set(cacheKey, { data: data.history, fetchedAt: Date.now() });
          setHistoryCacheVersion(v => v + 1);
        }
      }).catch(e => console.warn('[StockData] history fetch failed:', e));
    }
  }, [period]);

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
        failedYahooCalls,
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
