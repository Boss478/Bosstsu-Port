import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/stocks/route';
import { createGetRequest, createPostRequest } from '../helpers/request';

const mockQuote = vi.fn();
const mockSearch = vi.fn();
const mockChart = vi.fn();

vi.mock('yahoo-finance2', () => {
  function MockYahooFinance(this: {
    quote: typeof mockQuote;
    search: typeof mockSearch;
    chart: typeof mockChart;
  }) {
    this.quote = mockQuote;
    this.search = mockSearch;
    this.chart = mockChart;
  }
  return { default: MockYahooFinance };
});

describe('/api/stocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns 400 for unknown type', async () => {
      const req = createPostRequest('/api/stocks', { body: { type: 'unknown' } });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain('unknown type');
    });

    it('returns 400 for quotes without symbols', async () => {
      const req = createPostRequest('/api/stocks', { body: { type: 'quotes', symbols: [] } });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('symbols required');
    });

    it('fetches quotes and separates indices', async () => {
      mockQuote.mockResolvedValueOnce([
        {
          symbol: 'AAPL',
          shortName: 'Apple',
          regularMarketPrice: 150,
          regularMarketChange: 2,
          regularMarketChangePercent: 1.35,
          regularMarketVolume: 1000000,
          marketCap: 2500000000000,
          sector: 'Technology',
          regularMarketOpen: 148,
          regularMarketPreviousClose: 148,
          fiftyTwoWeekHigh: 180,
          fiftyTwoWeekLow: 120,
          trailingPE: 25,
          dividendYield: 0.005,
          dividendRate: 0.96,
          regularMarketDayHigh: 152,
          regularMarketDayLow: 147,
          currency: 'USD',
        },
        {
          symbol: '^GSPC',
          shortName: 'S&P 500',
          regularMarketPrice: 4500,
          regularMarketChange: 10,
          regularMarketChangePercent: 0.22,
        },
      ]);

      const req = createPostRequest('/api/stocks', {
        body: { type: 'quotes', symbols: ['AAPL', '^GSPC'] },
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.quotes).toHaveLength(1);
      expect(data.quotes[0].symbol).toBe('AAPL');
      expect(data.indices).toHaveLength(1);
      expect(data.indices[0].symbol).toBe('^GSPC');
    });

    it('returns 400 for history without symbol/period', async () => {
      const req = createPostRequest('/api/stocks', { body: { type: 'history' } });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('symbol and period required');
    });

    it('returns 400 for unknown period', async () => {
      const req = createPostRequest('/api/stocks', {
        body: { type: 'history', symbol: 'AAPL', period: '10y' },
      });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain('unknown period');
    });

    it('fetches history for valid period', async () => {
      mockChart.mockResolvedValueOnce({
        quotes: [
          { date: new Date('2024-01-01'), close: 150, volume: 100000 },
          { date: new Date('2024-01-02'), close: 152, volume: 110000 },
          { date: new Date('2024-01-03'), close: null },
        ],
      });

      const req = createPostRequest('/api/stocks', {
        body: { type: 'history', symbol: 'AAPL', period: '1m' },
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.history).toHaveLength(2);
      expect(data.history[0].price).toBe(150);
      expect(data.history[0].volume).toBe(100000);
    });

    it('handles yahoo-finance2 errors', async () => {
      mockQuote.mockRejectedValueOnce(new Error('API limit'));
      const req = createPostRequest('/api/stocks', { body: { type: 'quotes', symbols: ['AAPL'] } });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.error).toBe('API limit');
    });
  });

  describe('GET', () => {
    it('returns 400 without query param', async () => {
      const req = createGetRequest('/api/stocks');
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain('query param q required');
    });

    it('searches stocks and filters EQUITY/ETF', async () => {
      mockSearch.mockResolvedValueOnce({
        quotes: [
          { symbol: 'AAPL', shortname: 'Apple Inc.', exchDisp: 'NASDAQ', type: 'EQUITY' },
          { symbol: 'SPY', shortname: 'SPDR S&P 500', exchDisp: 'NYSE', type: 'ETF' },
          { symbol: 'USDTHB=X', shortname: 'USD/THB', type: 'CURRENCY' },
        ],
      });

      const req = createGetRequest('/api/stocks', { searchParams: { q: 'apple' } });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.stocks).toHaveLength(2);
      expect(data.stocks[0].symbol).toBe('AAPL');
      expect(data.stocks[1].symbol).toBe('SPY');
    });

    it('limits results to 10', async () => {
      const quotes = Array.from({ length: 15 }, (_, i) => ({
        symbol: `STOCK${i}`,
        shortname: `Stock ${i}`,
        type: 'EQUITY' as const,
      }));
      mockSearch.mockResolvedValueOnce({ quotes });

      const req = createGetRequest('/api/stocks', { searchParams: { q: 'stock' } });
      const res = await GET(req);
      const data = await res.json();

      expect(data.stocks).toHaveLength(10);
    });

    it('handles search errors', async () => {
      mockSearch.mockRejectedValueOnce(new Error('Network error'));
      const req = createGetRequest('/api/stocks', { searchParams: { q: 'test' } });
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.error).toBe('Network error');
    });
  });
});
