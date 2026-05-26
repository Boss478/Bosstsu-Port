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

function smoothRandomWalk(price: number): number {
  const change = price * (Math.random() - 0.495) * 0.004;
  return Math.round((price + change) * 100) / 100;
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateMockHistory(days: number, basePrice: number, volatility: number): StockHistory[] {
  const data: StockHistory[] = [];
  let price = basePrice;
  const now = new Date();

  if (days <= 1) {
    for (let h = 0; h < 39; h++) {
      const hour = Math.floor(9.5 + h * 0.1667);
      const minute = Math.round((h * 10) % 60);
      const date = new Date(now);
      date.setHours(hour, minute, 0, 0);
      if (date > now) break;
      const change = price * (Math.random() - 0.48) * 0.002;
      price += change;
      data.push({
        date: date.toISOString(),
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 500000) + 50000,
      });
    }
    if (data.length === 0) {
      data.push({ date: now.toISOString(), price: basePrice, volume: 0 });
    }
    return data;
  }

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const change = price * (Math.random() - 0.48) * volatility;
    price += change;
    data.push({
      date: date.toISOString().slice(0, 10),
      price: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 10000000) + 500000,
    });
  }
  return data;
}

const MOCK_STOCKS: ExtendedStockData[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 198.50, change: 2.30, changePercent: 1.17, volume: 52000000, marketCap: 3100000000000, sector: 'Technology', open: 196.50, previousClose: 196.20, fiftyTwoWeekHigh: 250.00, fiftyTwoWeekLow: 165.00, peRatio: 30.5, dividendYield: 0.55, dividendAmount: 0.25, regularMarketDayHigh: 199.00, regularMarketDayLow: 197.00 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 175.20, change: -1.10, changePercent: -0.62, volume: 28000000, marketCap: 2200000000000, sector: 'Technology', open: 176.00, previousClose: 176.30, fiftyTwoWeekHigh: 200.00, fiftyTwoWeekLow: 130.00, peRatio: 25.0, dividendYield: 0, dividendAmount: 0, regularMarketDayHigh: 176.50, regularMarketDayLow: 174.80 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 425.30, change: 3.40, changePercent: 0.81, volume: 19000000, marketCap: 3160000000000, sector: 'Technology', open: 422.00, previousClose: 421.90, fiftyTwoWeekHigh: 500.00, fiftyTwoWeekLow: 350.00, peRatio: 35.0, dividendYield: 0.70, dividendAmount: 0.75, regularMarketDayHigh: 426.00, regularMarketDayLow: 422.50 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 195.80, change: -0.90, changePercent: -0.46, volume: 35000000, marketCap: 2030000000000, sector: 'Consumer Cyclical', open: 196.50, previousClose: 196.70, fiftyTwoWeekHigh: 220.00, fiftyTwoWeekLow: 145.00, peRatio: 45.0, dividendYield: 0, dividendAmount: 0, regularMarketDayHigh: 197.00, regularMarketDayLow: 195.00 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.60, change: 5.20, changePercent: 2.14, volume: 89000000, marketCap: 790000000000, sector: 'Automotive', open: 244.00, previousClose: 243.40, fiftyTwoWeekHigh: 300.00, fiftyTwoWeekLow: 180.00, peRatio: 60.0, dividendYield: 0, dividendAmount: 0, regularMarketDayHigh: 250.00, regularMarketDayLow: 244.50 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 880.10, change: 12.50, changePercent: 1.44, volume: 41000000, marketCap: 2170000000000, sector: 'Technology', open: 870.00, previousClose: 867.60, fiftyTwoWeekHigh: 950.00, fiftyTwoWeekLow: 400.00, peRatio: 75.0, dividendYield: 0.04, dividendAmount: 0.04, regularMarketDayHigh: 885.00, regularMarketDayLow: 870.00 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 505.70, change: -2.30, changePercent: -0.45, volume: 15000000, marketCap: 1290000000000, sector: 'Technology', open: 508.00, previousClose: 508.00, fiftyTwoWeekHigh: 550.00, fiftyTwoWeekLow: 350.00, peRatio: 28.0, dividendYield: 0.50, dividendAmount: 0.50, regularMarketDayHigh: 510.00, regularMarketDayLow: 504.00 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 198.40, change: 0.80, changePercent: 0.40, volume: 8000000, marketCap: 570000000000, sector: 'Financial', open: 197.50, previousClose: 197.60, fiftyTwoWeekHigh: 220.00, fiftyTwoWeekLow: 170.00, peRatio: 12.0, dividendYield: 2.20, dividendAmount: 1.05, regularMarketDayHigh: 199.00, regularMarketDayLow: 197.50 },
  { symbol: 'V', name: 'Visa Inc.', price: 275.30, change: 1.10, changePercent: 0.40, volume: 7000000, marketCap: 560000000000, sector: 'Financial', open: 274.00, previousClose: 274.20, fiftyTwoWeekHigh: 300.00, fiftyTwoWeekLow: 240.00, peRatio: 30.0, dividendYield: 0.75, dividendAmount: 0.52, regularMarketDayHigh: 276.00, regularMarketDayLow: 274.00 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 158.20, change: -0.60, changePercent: -0.38, volume: 5500000, marketCap: 380000000000, sector: 'Healthcare', open: 158.80, previousClose: 158.80, fiftyTwoWeekHigh: 180.00, fiftyTwoWeekLow: 145.00, peRatio: 15.0, dividendYield: 3.00, dividendAmount: 1.20, regularMarketDayHigh: 159.50, regularMarketDayLow: 157.50 },
];

const MOCK_INDEXES: MarketIndex[] = [
  { name: 'S&P 500', value: 5810.50, change: 23.40, changePercent: 0.40 },
  { name: 'NASDAQ', value: 18420.80, change: 95.30, changePercent: 0.52 },
  { name: 'DJIA', value: 42150.30, change: -15.20, changePercent: -0.04 },
  { name: 'SET', value: 1380.60, change: 8.20, changePercent: 0.60 },
];

const MOCK_PORTFOLIO: PortfolioHolding[] = [
  { symbol: 'TSM',   shares: 0.0240648, avgCost: 327.4490 },
  { symbol: 'GOOGL', shares: 0.0231279, avgCost: 338.5523 },
  { symbol: 'NVDA',  shares: 0.0300421, avgCost: 203.0486 },
  { symbol: 'AAPL',  shares: 0.0112620, avgCost: 271.7091 },
  { symbol: 'MSFT',  shares: 0.0060125, avgCost: 508.94 },
  { symbol: 'META',  shares: 0.0025555, avgCost: 618.28 },
  { symbol: 'AMD',   shares: 0.0030919, avgCost: 419.60 },
];

const DEFAULT_SYMBOLS = ['TSM', 'GOOGL', 'NVDA', 'AAPL', 'MSFT', 'META', 'AMD'];

export function StockDataProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [period, setPeriod] = useState<Period>('1m');
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'MSFT', 'NVDA', 'META']);
  const [stocks, setStocks] = useState<ExtendedStockData[]>(MOCK_STOCKS);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [failedYahooCalls, setFailedYahooCalls] = useState(0);

  const [historyCacheVersion, setHistoryCacheVersion] = useState(0);
  const historyCache = useRef<Map<string, HistoryCacheEntry>>(new Map());
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const stocksRef = useRef(stocks);
  const failedCallsRef = useRef(0);

  stocksRef.current = stocks;
  failedCallsRef.current = failedYahooCalls;

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
    } catch {
      const newFailCount = failedCallsRef.current + 1;
      setFailedYahooCalls(newFailCount);
      failedCallsRef.current = newFailCount;

      setStocks(prev => prev.map(s => {
        const newPrice = smoothRandomWalk(s.price);
        const change = newPrice - s.previousClose;
        return {
          ...s,
          price: newPrice,
          change,
          changePercent: s.previousClose > 0 ? (change / s.previousClose) * 100 : 0,
        };
      }));
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

  const history = useMemo(() => {
    const config = PERIOD_CONFIG.find(p => p.value === period);
    const days = config?.days ?? 30;
    const h: Record<string, StockHistory[]> = {};
    const currentStocks = stocksRef.current;

    for (const stock of currentStocks) {
      const cacheKey = `${stock.symbol}_${period}`;
      const cached = historyCache.current.get(cacheKey);
      const ttl = CACHE_TTL[period] || CACHE_TTL.default;

      if (cached && Date.now() - cached.fetchedAt < ttl) {
        h[stock.symbol] = cached.data;
        continue;
      }

      h[stock.symbol] = generateMockHistory(days, stock.price, 0.015);
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
      }).catch(() => {});
    }
  }, [period]);

  const addToWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.includes(symbol) ? prev : [...prev, symbol]);
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
  };

  return (
    <StockDataContext.Provider
      value={{
        stocks,
        indexes: MOCK_INDEXES,
        portfolio,
        history,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        updateHolding,
        addHolding,
        removeHolding,
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
