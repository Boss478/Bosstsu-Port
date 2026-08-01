import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectTestDb, disconnectTestDb, clearCollection } from '../../helpers/db';
import ToolSession from '@/models/ToolSession';

describe('ToolSession model', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearCollection('toolsessions');
  });

  it('persists forceTier field', async () => {
    const doc = await ToolSession.create({
      sessionCode: 'test-force-tier',
      type: 'quiz',
      title: 'Force Tier Test',
      config: { forceTier: 'ultra' },
    });
    const found = await ToolSession.findById(doc._id).lean();
    expect(found).toBeDefined();
    expect((found as Record<string, unknown>).config).toHaveProperty('forceTier', 'ultra');
  });

  it('persists customTierConfig subdocument', async () => {
    const doc = await ToolSession.create({
      sessionCode: 'test-custom-tier',
      type: 'quiz',
      title: 'Custom Tier Test',
      config: {
        customTierConfig: {
          fps: 30,
          transitions: false,
          particles: true,
          imageQuality: 0.8,
        },
      },
    });
    const found = await ToolSession.findById(doc._id).lean();
    expect(found).toBeDefined();
    const config = (found as Record<string, unknown>).config as Record<string, unknown>;
    const customTier = config.customTierConfig as Record<string, unknown>;
    expect(customTier.fps).toBe(30);
    expect(customTier.transitions).toBe(false);
    expect(customTier.particles).toBe(true);
    expect(customTier.imageQuality).toBe(0.8);
  });

  it('persists forceTier on step config', async () => {
    const doc = await ToolSession.create({
      sessionCode: 'test-step-tier',
      type: 'assignment',
      title: 'Step Tier Test',
      config: {},
      steps: [
        {
          type: 'poll',
          title: 'Step 1',
          config: { forceTier: 'low', enableMascots: false },
        },
      ],
    });
    const found = await ToolSession.findById(doc._id).lean();
    expect(found).toBeDefined();
    const steps = (found as Record<string, unknown>).steps as Record<string, unknown>[];
    expect((steps[0].config as Record<string, unknown>).forceTier).toBe('low');
    expect((steps[0].config as Record<string, unknown>).enableMascots).toBe(false);
  });

  it('requires sessionCode', async () => {
    await expect(ToolSession.create({ type: 'padlet', title: 'No Code' })).rejects.toThrow();
  });

  it('enforces unique sessionCode', async () => {
    await ToolSession.create({ sessionCode: 'dup', type: 'poll', title: 'First' });
    await expect(
      ToolSession.create({ sessionCode: 'dup', type: 'poll', title: 'Second' }),
    ).rejects.toThrow();
  });
});
