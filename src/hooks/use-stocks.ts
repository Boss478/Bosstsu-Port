import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockKeys } from '@/lib/query/keys';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
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

export interface Holding {
  symbol: string;
  shares: number;
  avgCost: number;
  manualPrice?: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const CACHE_TTL: Record<string, number> = {
  '1d': 5 * 60_000,
  '5d': 5 * 60_000,
  default: 60 * 60_000,
};

function getStaleTimeForPeriod(period: string): number {
  return CACHE_TTL[period] ?? CACHE_TTL.default;
}

export function useStockQuotes(symbols: string[], refetchInterval?: number | false) {
  return useQuery({
    queryKey: stockKeys.quotes(),
    queryFn: async () => {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quotes', symbols }),
      });
      if (!res.ok) throw new Error('Failed to fetch quotes');
      const json = await res.json();
      return {
        quotes: (json.quotes || []) as StockQuote[],
        indices: (json.indices || []) as MarketIndex[],
      };
    },
    enabled: symbols.length > 0,
    refetchInterval,
    staleTime: 60 * 1000,
  });
}

export function useStockHistory(symbol: string | null, period: string) {
  return useQuery({
    queryKey: stockKeys.history(symbol ?? '', period),
    queryFn: async () => {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'history', symbol, period }),
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      const json = await res.json();
      return (json.history || []) as StockHistory[];
    },
    enabled: !!symbol,
    staleTime: getStaleTimeForPeriod(period),
  });
}

export function useHoldings() {
  return useQuery({
    queryKey: stockKeys.holdings(),
    queryFn: async () => {
      const res = await fetch('/boss478/api/holdings');
      if (!res.ok) throw new Error('Failed to fetch holdings');
      const json = await res.json();
      return (json.holdings || []) as Holding[];
    },
    staleTime: 30 * 1000,
  });
}

export function useWatchlist() {
  return useQuery({
    queryKey: stockKeys.watchlist(),
    queryFn: async () => {
      const res = await fetch('/boss478/api/watchlist');
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      const json = await res.json();
      return (json.symbols || []) as string[];
    },
    staleTime: 30 * 1000,
  });
}

export function useAddHolding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { symbol: string; shares: number; avgCost: number; manualPrice?: number }) => {
      const res = await fetch('/boss478/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add holding');
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: stockKeys.holdings() });
    },
  });
}

export function useRemoveHolding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      const res = await fetch('/boss478/api/holdings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) throw new Error('Failed to remove holding');
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: stockKeys.holdings() });
    },
  });
}

export function useUpdateWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbols: string[]) => {
      const res = await fetch('/boss478/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });
      if (!res.ok) throw new Error('Failed to update watchlist');
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: stockKeys.watchlist() });
      qc.invalidateQueries({ queryKey: stockKeys.quotes() });
    },
  });
}
