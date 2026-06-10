interface QueuedEvent {
  type: 'pageview' | 'custom';
  path: string;
  sessionId: string;
  eventName?: string;
  metadata?: Record<string, unknown>;
  referrer?: string;
  userAgent?: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

const MAX_RETRIES = 3;

class AnalyticsQueue {
  private queue: QueuedEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private readonly flushInterval: number;
  private readonly maxBatch: number;
  private readonly maxQueue: number;
  private readonly handleUnload: () => void;

  constructor(flushInterval = 30000, maxBatch = 50, maxQueue = 200) {
    this.flushInterval = flushInterval;
    this.maxBatch = maxBatch;
    this.maxQueue = maxQueue;
    this.handleUnload = () => this.flushSync();
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleUnload);
    }
  }

  push(event: QueuedEvent): void {
    if (this.queue.length >= this.maxQueue) {
      this.queue.shift();
    }
    this.queue.push(event);
    if (this.queue.length >= this.maxBatch) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    this.timer = null;
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
      this.retryCount = 0;
    } catch {
      if (this.retryCount < MAX_RETRIES) {
        this.retryCount++;
        this.queue.unshift(...batch);
        const delay = Math.min(1000 * 2 ** (this.retryCount - 1), 8000);
        this.timer = setTimeout(() => this.flush(), delay);
      }
    }
  }

  private flushSync(): void {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    try {
      navigator.sendBeacon('/api/analytics', JSON.stringify({ events: batch }));
    } catch {
      // silent
    }
  }

  destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleUnload);
    }
  }
}

export const analyticsQueue = new AnalyticsQueue();
