'use client';

import { useMemo } from 'react';
import type { PortfolioHolding, ExtendedStockData } from './StockDataContext';

export interface EnrichedHolding extends PortfolioHolding {
  currentPrice: number;
  totalCost: number;
  totalValue: number;
  pl: number;
  plPercent: number;
}

export function useEnrichedHoldings(
  portfolio: PortfolioHolding[],
  stocks: ExtendedStockData[]
): EnrichedHolding[] {
  return useMemo(() => {
    return portfolio.map(h => {
      const current = stocks.find(s => s.symbol === h.symbol);
      const effectivePrice = h.manualPrice ?? current?.price ?? 0;
      const totalCost = h.shares * h.avgCost;
      const totalValue = h.shares * effectivePrice;
      const pl = totalValue - totalCost;
      const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;
      return { ...h, currentPrice: effectivePrice, totalCost, totalValue, pl, plPercent };
    });
  }, [portfolio, stocks]);
}

export function usePortfolioAggregates(enriched: EnrichedHolding[]) {
  return useMemo(() => {
    const totalValue = enriched.reduce((s, h) => s + h.totalValue, 0);
    const totalCost = enriched.reduce((s, h) => s + h.totalCost, 0);
    const totalPl = totalValue - totalCost;
    const totalPlPercent = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;

    const sorted = [...enriched].sort((a, b) => b.plPercent - a.plPercent);
    const bestHolding = sorted.length > 0 ? sorted[0] : null;
    const worstHolding = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    return { totalValue, totalCost, totalPl, totalPlPercent, bestHolding, worstHolding };
  }, [enriched]);
}
