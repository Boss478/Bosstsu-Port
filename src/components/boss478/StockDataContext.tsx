'use client';

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

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

export interface StockHistory {
  date: string;
  price: number;
  volume: number;
}

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  avgCost: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export type Period = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

export type TabId = 'overview' | 'portfolio' | 'charts' | 'watchlist';

interface StockDataContextValue {
  stocks: StockData[];
  indexes: MarketIndex[];
  portfolio: PortfolioHolding[];
  history: Record<string, StockHistory[]>;
  watchlist: string[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  period: Period;
  setPeriod: (p: Period) => void;
}

const StockDataContext = createContext<StockDataContextValue | null>(null);

function generateMockHistory(days: number, basePrice: number, volatility: number): StockHistory[] {
  const data: StockHistory[] = [];
  let price = basePrice;
  const now = new Date();
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

const MOCK_STOCKS: StockData[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 198.50, change: 2.30, changePercent: 1.17, volume: 52000000, marketCap: 3100000000000, sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 175.20, change: -1.10, changePercent: -0.62, volume: 28000000, marketCap: 2200000000000, sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 425.30, change: 3.40, changePercent: 0.81, volume: 19000000, marketCap: 3160000000000, sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 195.80, change: -0.90, changePercent: -0.46, volume: 35000000, marketCap: 2030000000000, sector: 'Consumer Cyclical' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.60, change: 5.20, changePercent: 2.14, volume: 89000000, marketCap: 790000000000, sector: 'Automotive' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 880.10, change: 12.50, changePercent: 1.44, volume: 41000000, marketCap: 2170000000000, sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 505.70, change: -2.30, changePercent: -0.45, volume: 15000000, marketCap: 1290000000000, sector: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 198.40, change: 0.80, changePercent: 0.40, volume: 8000000, marketCap: 570000000000, sector: 'Financial' },
  { symbol: 'V', name: 'Visa Inc.', price: 275.30, change: 1.10, changePercent: 0.40, volume: 7000000, marketCap: 560000000000, sector: 'Financial' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 158.20, change: -0.60, changePercent: -0.38, volume: 5500000, marketCap: 380000000000, sector: 'Healthcare' },
];

const MOCK_INDEXES: MarketIndex[] = [
  { name: 'S&P 500', value: 5810.50, change: 23.40, changePercent: 0.40 },
  { name: 'NASDAQ', value: 18420.80, change: 95.30, changePercent: 0.52 },
  { name: 'DJIA', value: 42150.30, change: -15.20, changePercent: -0.04 },
  { name: 'SET', value: 1380.60, change: 8.20, changePercent: 0.60 },
];

const MOCK_PORTFOLIO: PortfolioHolding[] = [
  { symbol: 'AAPL', shares: 50, avgCost: 175.20 },
  { symbol: 'MSFT', shares: 25, avgCost: 390.50 },
  { symbol: 'NVDA', shares: 15, avgCost: 720.00 },
  { symbol: 'TSLA', shares: 30, avgCost: 220.80 },
];

export function StockDataProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [period, setPeriod] = useState<Period>('1m');
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'MSFT', 'NVDA', 'META']);

  const history = useMemo(() => {
    const daysMap: Record<Period, number> = { '1d': 1, '1w': 5, '1m': 22, '3m': 66, '1y': 252, 'all': 504 };
    const days = daysMap[period];
    const h: Record<string, StockHistory[]> = {};
    for (const stock of MOCK_STOCKS) {
      h[stock.symbol] = generateMockHistory(days, stock.price, 0.015);
    }
    return h;
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
        stocks: MOCK_STOCKS,
        indexes: MOCK_INDEXES,
        portfolio: MOCK_PORTFOLIO,
        history,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        activeTab,
        setActiveTab,
        period,
        setPeriod,
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
