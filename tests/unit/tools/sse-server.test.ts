import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  addClient,
  tryAddClient,
  removeClient,
  getTotalConnectedCount,
  getConnectedCount,
  getIpConnectedCount,
  notifyStepChange,
  notifyResponsesChange,
} from '@/lib/sse-server';

function makeController(desiredSize?: number) {
  return {
    enqueue: vi.fn(),
    error: vi.fn(),
    close: vi.fn(),
    ...(desiredSize !== undefined && { desiredSize }),
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

  it('enforces MAX_TOTAL_CLIENTS capacity (150)', () => {
    const sessionCount = 3;
    const perSession = 50;
    for (let s = 0; s < sessionCount; s++) {
      for (let i = 0; i < perSession; i++) {
        track(`cap${s}`, makeController());
      }
    }
    expect(getTotalConnectedCount()).toBe(150);

    const rejected = makeController();
    const cleanup = addClient('capX', rejected);
    expect(rejected.error).toHaveBeenCalled();
    expect(getTotalConnectedCount()).toBe(150);
    cleanup();
  });

  it('enforces MAX_CLIENTS_PER_IP — 9th client from one IP is rejected', () => {
    for (let i = 0; i < 8; i++) {
      const c = makeController();
      const res = tryAddClient('ipcap', c, { ip: '10.0.0.1' });
      expect(res.accepted).toBe(true);
      added.push({ sessionId: 'ipcap', controller: c });
    }
    expect(getIpConnectedCount('10.0.0.1')).toBe(8);

    const rejected = makeController();
    const res = tryAddClient('ipcap', rejected, { ip: '10.0.0.1' });
    expect(res.accepted).toBe(false);
    expect(rejected.error).toHaveBeenCalled();
    expect(getIpConnectedCount('10.0.0.1')).toBe(8);

    // a different IP is still welcome
    const other = makeController();
    const res2 = tryAddClient('ipcap', other, { ip: '10.0.0.2' });
    expect(res2.accepted).toBe(true);
    added.push({ sessionId: 'ipcap', controller: other });

    // removing a client frees its IP slot
    removeClient('ipcap', added[0].controller);
    const retry = makeController();
    const res3 = tryAddClient('ipcap', retry, { ip: '10.0.0.1' });
    expect(res3.accepted).toBe(true);
    added.push({ sessionId: 'ipcap', controller: retry });
  });

  it('drops backpressured clients (desiredSize < 0) instead of buffering', () => {
    const slow = makeController(-1);
    track('bp1', slow);

    notifyResponsesChange('bp1');

    expect(slow.enqueue).not.toHaveBeenCalled();
    expect(slow.close).toHaveBeenCalled();
    expect(getConnectedCount('bp1')).toBe(0);
  });

  it('notifyStepChange targets the kick only at the matching token (no token leak)', () => {
    const kicked = makeController();
    const bystander = makeController();
    added.push({ sessionId: 'kick2', controller: kicked });
    added.push({ sessionId: 'kick2', controller: bystander });
    addClient('kick2', kicked, { token: 'tokA' });
    addClient('kick2', bystander, { token: 'tokB' });

    const decodeFrame = (controller: ReadableStreamDefaultController, call: number) => {
      const frame = new TextDecoder().decode(
        (controller.enqueue as ReturnType<typeof vi.fn>).mock.calls[call][0],
      );
      return JSON.parse(
        frame
          .split('\n')
          .find((l) => l.startsWith('data: '))!
          .slice(6),
      ) as { type: string; currentStep: number; kicked: boolean; kickedTokens: string[] };
    };

    notifyStepChange('kick2', 2, ['tokA']);

    // bystander only ever receives the generic frame — no other client's token
    expect(bystander.enqueue).toHaveBeenCalledTimes(1);
    expect(decodeFrame(bystander, 0)).toMatchObject({
      type: 'step',
      currentStep: 2,
      kicked: false,
      kickedTokens: [],
    });

    // kicked client receives the generic frame, then the targeted kick frame
    expect(kicked.enqueue).toHaveBeenCalledTimes(2);
    expect(decodeFrame(kicked, 0)).toMatchObject({
      type: 'step',
      currentStep: 2,
      kicked: false,
      kickedTokens: [],
    });
    expect(decodeFrame(kicked, 1)).toMatchObject({
      type: 'step',
      currentStep: 2,
      kicked: true,
      kickedTokens: ['tokA'],
    });

    // kick without tokens → generic broadcast only
    notifyStepChange('kick2', 3);
    expect(kicked.enqueue).toHaveBeenCalledTimes(3);
    expect(bystander.enqueue).toHaveBeenCalledTimes(2);
  });

  it('enforces MAX_CLIENTS_PER_SESSION — 51st client gets error() and count stays 50', () => {
    for (let i = 0; i < 50; i++) {
      track('per50', makeController());
    }
    expect(getConnectedCount('per50')).toBe(50);
    expect(getTotalConnectedCount()).toBe(50);

    const rejected = makeController();
    const cleanup = addClient('per50', rejected);
    expect(rejected.error).toHaveBeenCalled();
    expect(getConnectedCount('per50')).toBe(50);
    expect(getTotalConnectedCount()).toBe(50);

    // cleanup of a rejected client is a safe no-op
    cleanup();
  });
});

describe('sse-server responses event', () => {
  it('sends an additive responses frame with no response payload', () => {
    const c1 = makeController();
    track('resp1', c1);

    notifyResponsesChange('resp1');

    const frame = new TextDecoder().decode(
      (c1.enqueue as ReturnType<typeof vi.fn>).mock.calls[0][0],
    );
    expect(frame.startsWith('event: responses\n')).toBe(true);
    const data = JSON.parse(
      frame
        .split('\n')
        .find((l) => l.startsWith('data: '))!
        .slice(6),
    );
    expect(data).toEqual({ type: 'responses' });
  });

  it('only notifies clients of the target session', () => {
    const c1 = makeController();
    const c2 = makeController();
    track('respA', c1);
    track('respB', c2);

    notifyResponsesChange('respA');

    expect(c1.enqueue).toHaveBeenCalledTimes(1);
    expect(c2.enqueue).not.toHaveBeenCalled();
  });

  it('resets the idle timer (active session)', () => {
    const c1 = makeController();
    track('respIdle', c1);
    notifyResponsesChange('respIdle'); // arms + resets the idle timer

    vi.advanceTimersByTime(10 * 60 * 1000);
    notifyResponsesChange('respIdle');
    vi.advanceTimersByTime(10 * 60 * 1000);

    expect(getTotalConnectedCount()).toBe(1);
    expect(c1.close).not.toHaveBeenCalled();
  });
});
