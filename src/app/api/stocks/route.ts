/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

const INDEX_SYMBOLS = ['^GSPC', '^IXIC', '^DJI', '^SET.BK', '^SET50.BK'];

const PERIOD_MAP: Record<string, { days: number; interval: '5m' | '30m' | '1d' | '1wk' | '1mo' }> = {
  '1d':  { days: 1,    interval: '5m' },
  '5d':  { days: 5,    interval: '30m' },
  '1w':  { days: 7,    interval: '30m' },
  '1m':  { days: 30,   interval: '1d' },
  '3m':  { days: 90,   interval: '1d' },
  '6m':  { days: 180,  interval: '1d' },
  'ytd': { days: 180,  interval: '1wk' },
  '1y':  { days: 365,  interval: '1wk' },
  '5y':  { days: 1825, interval: '1mo' },
  'all': { days: 3650, interval: '1mo' },
};

let yfPromise: Promise<any> | null = null;

async function getYahooFinance() {
  if (!yfPromise) {
    yfPromise = import('yahoo-finance2').then(m => new m.default());
  }
  return yfPromise;
}

function safeNum(val: unknown, fallback = 0): number {
  return typeof val === 'number' ? val : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const yahooFinance = await getYahooFinance();
    const body = await request.json();
    const { type } = body;

    if (type === 'quotes') {
      const symbols: string[] = body.symbols;
      if (!symbols?.length) {
        return NextResponse.json({ error: 'symbols required' }, { status: 400 });
      }

      const batchResult = await yahooFinance.quote(symbols);
      const resultsArray = Array.isArray(batchResult) ? batchResult : [batchResult];

      const quotes = resultsArray
        .filter((q: any) => q?.symbol && !INDEX_SYMBOLS.includes(q.symbol))
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortName || q.longName || q.symbol,
          price: safeNum(q.regularMarketPrice),
          change: safeNum(q.regularMarketChange),
          changePercent: safeNum(q.regularMarketChangePercent),
          volume: safeNum(q.regularMarketVolume),
          marketCap: safeNum(q.marketCap),
          sector: q.sector || '',
          open: safeNum(q.regularMarketOpen),
          previousClose: safeNum(q.regularMarketPreviousClose),
          fiftyTwoWeekHigh: safeNum(q.fiftyTwoWeekHigh, safeNum(q.regularMarketPrice)),
          fiftyTwoWeekLow: safeNum(q.fiftyTwoWeekLow, safeNum(q.regularMarketPrice)),
          peRatio: safeNum(q.trailingPE),
          dividendYield: safeNum(q.dividendYield),
          dividendAmount: safeNum(q.dividendRate),
          regularMarketDayHigh: safeNum(q.regularMarketDayHigh),
          regularMarketDayLow: safeNum(q.regularMarketDayLow),
          currency: q.currency || 'USD',
        }));

      const indices = resultsArray
        .filter((q: any) => q?.symbol && INDEX_SYMBOLS.includes(q.symbol))
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortName || q.symbol,
          value: safeNum(q.regularMarketPrice ?? q.marketCap ?? q.price),
          change: safeNum(q.regularMarketChange),
          changePercent: safeNum(q.regularMarketChangePercent),
        }));

      return NextResponse.json({ quotes, indices });
    }

    if (type === 'history') {
      const { symbol, period } = body;
      if (!symbol || !period) {
        return NextResponse.json({ error: 'symbol and period required' }, { status: 400 });
      }

      const config = PERIOD_MAP[period];
      if (!config) {
        return NextResponse.json({ error: `unknown period: ${period}` }, { status: 400 });
      }

      const period1 = new Date(Date.now() - config.days * 24 * 60 * 60 * 1000);
      const chart = await yahooFinance.chart(symbol, {
        period1,
        interval: config.interval,
      });

      const quotes = (chart?.quotes || []).filter((q: any) => q.close != null);
      const history = quotes.map((q: any) => ({
        date: q.date instanceof Date ? q.date.toISOString() : String(q.date),
        price: Math.round(q.close * 100) / 100,
        volume: q.volume || 0,
      }));

      return NextResponse.json({ history });
    }

    return NextResponse.json({ error: `unknown type: ${type}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.length < 1) {
    return NextResponse.json({ error: 'query param q required' }, { status: 400 });
  }

  try {
    const yahooFinance = await getYahooFinance();
    const result = await yahooFinance.search(q);
    const stocks = (result.quotes || []).filter((s: any) => s.type === 'EQUITY' || s.type === 'ETF')
      .slice(0, 10)
      .map((s: any) => ({
        symbol: s.symbol,
        name: s.shortname || s.longname || s.symbol,
        exchange: s.exchDisp || s.exchange || '',
        type: s.type,
      }));

    return NextResponse.json({ stocks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
