import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  addClient,
  removeClient,
  getTotalConnectedCount,
  getConnectedCount,
  notifyStepChange,
} from '@/lib/sse-server';

function makeController() {
  return {
    enqueue: vi.fn(),
    error: vi.fn(),
    close: vi.fn(),
  } as unknown as ReadableStreamDefaultController;
}

const added: Array<{ sessionId: string; controller: ReadableStreamDefaultController }> = [];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  for (const { sessionId, controller } of added.splice(0)) {
    removeClient(sessionId, controller);
  }
  vi.advanceTimersByTime(16 * 60 * 1000);
  vi.useRealTimers();
});

function track(sessionId: string, controller: ReadableStreamDefaultController) {
  added.push({ sessionId, controller });
  return addClient(sessionId, controller);
}

describe('sse-server client accounting', () => {
  it('removeClient decrements totalClients', () => {
    const c1 = makeController();
    const c2 = makeController();
    track('acc1', c1);
    track('acc1', c2);
    expect(getTotalConnectedCount()).toBe(2);

    removeClient('acc1', c1);
    expect(getTotalConnectedCount()).toBe(1);
    expect(getConnectedCount('acc1')).toBe(1);
  });

  it('idle timer decrements totalClients and closes controllers', () => {
    const c1 = makeController();
    track('idle1', c1);
    notifyStepChange('idle1', 0); // arms the idle timer
    expect(getTotalConnectedCount()).toBe(1);

    vi.advanceTimersByTime(15 * 60 * 1000);

    expect(getTotalConnectedCount()).toBe(0);
    expect(getConnectedCount('idle1')).toBe(0);
    expect(c1.close).toHaveBeenCalled();
  });

  it('enforces MAX_TOTAL_CLIENTS capacity', () => {
    const sessionCount = 8;
    const perSession = 50;
    for (let s = 0; s < sessionCount; s++) {
      for (let i = 0; i < perSession; i++) {
        track(`cap${s}`, makeController());
      }
    }
    expect(getTotalConnectedCount()).toBe(400);

    const rejected = makeController();
    const cleanup = addClient('capX', rejected);
    expect(rejected.error).toHaveBeenCalled();
    expect(getTotalConnectedCount()).toBe(400);
    cleanup();
  });

  it('notifyStepChange includes kickedTokens when kicking', () => {
    const c1 = makeController();
    track('kick1', c1);

    notifyStepChange('kick1', 2, ['tokA']);
    const frame1 = new TextDecoder().decode(
      (c1.enqueue as ReturnType<typeof vi.fn>).mock.calls[0][0],
    );
    const data1 = JSON.parse(
      frame1
        .split('\n')
        .find((l) => l.startsWith('data: '))!
        .slice(6),
    );
    expect(data1).toMatchObject({
      type: 'step',
      currentStep: 2,
      kicked: true,
      kickedTokens: ['tokA'],
    });

    notifyStepChange('kick1', 3);
    const frame2 = new TextDecoder().decode(
      (c1.enqueue as ReturnType<typeof vi.fn>).mock.calls[1][0],
    );
    const data2 = JSON.parse(
      frame2
        .split('\n')
        .find((l) => l.startsWith('data: '))!
        .slice(6),
    );
    expect(data2).toMatchObject({ type: 'step', currentStep: 3, kicked: false, kickedTokens: [] });
  });
});
