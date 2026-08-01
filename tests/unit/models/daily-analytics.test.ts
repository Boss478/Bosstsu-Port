import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectTestDb, disconnectTestDb, clearCollection } from '../../helpers/db';
import DailyAnalytics from '@/models/DailyAnalytics';

describe('DailyAnalytics model', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearCollection('dailyanalytics');
  });

  it('stores deviceBreakdown with name key', async () => {
    const doc = await DailyAnalytics.create({
      date: '2026-07-27',
      totalViews: 100,
      uniqueVisitors: 50,
      deviceBreakdown: [
        { name: 'desktop', count: 60 },
        { name: 'mobile', count: 30 },
        { name: 'tablet', count: 10 },
      ],
    });
    const found = await DailyAnalytics.findById(doc._id).lean();
    expect(found).toBeDefined();
    const devices = (found as Record<string, unknown>).deviceBreakdown as Record<string, unknown>[];
    expect(devices).toHaveLength(3);
    expect(devices[0]).toHaveProperty('name');
    expect(devices[0].name).toBe('desktop');
    expect(devices[0].count).toBe(60);
  });

  it('handles empty deviceBreakdown', async () => {
    const doc = await DailyAnalytics.create({
      date: '2026-07-26',
      totalViews: 0,
      deviceBreakdown: [],
    });
    const found = await DailyAnalytics.findById(doc._id).lean();
    expect((found as Record<string, unknown>).deviceBreakdown).toEqual([]);
  });

  it('stores osBreakdown with name key', async () => {
    const doc = await DailyAnalytics.create({
      date: '2026-07-25',
      totalViews: 200,
      osBreakdown: [
        { name: 'iOS', count: 80 },
        { name: 'Android', count: 120 },
      ],
    });
    const found = await DailyAnalytics.findById(doc._id).lean();
    const os = (found as Record<string, unknown>).osBreakdown as Record<string, unknown>[];
    expect(os).toHaveLength(2);
    expect(os[0].name).toBe('iOS');
  });

  it('enforces unique date', async () => {
    await DailyAnalytics.create({ date: '2026-07-27' });
    await expect(DailyAnalytics.create({ date: '2026-07-27' })).rejects.toThrow();
  });
});
