export type SSEController = ReadableStreamDefaultController;

export interface StepChangeEvent {
  type: 'step';
  currentStep: number;
  kicked: boolean;
}

export interface BroadcastEvent {
  type: 'broadcast';
  message: string;
  messageType: 'message' | 'timer' | 'sticky';
  duration?: number;
}

export type SSEClientEvent = StepChangeEvent | BroadcastEvent;

const clients = new Map<string, Set<SSEController>>();
const idleTimers = new Map<string, ReturnType<typeof setTimeout>>();

const MAX_CLIENTS_PER_SESSION = 50;
const MAX_TOTAL_CLIENTS = 400;
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

let totalClients = 0;

export function addClient(sessionId: string, controller: SSEController): () => void {
  if (totalClients >= MAX_TOTAL_CLIENTS) {
    controller.error(new Error('Server at capacity'));
    return () => {};
  }

  if (!clients.has(sessionId)) {
    clients.set(sessionId, new Set());
  }

  const sessionClients = clients.get(sessionId)!;

  if (sessionClients.size >= MAX_CLIENTS_PER_SESSION) {
    controller.error(new Error('Session at capacity'));
    return () => {};
  }

  sessionClients.add(controller);
  totalClients++;

  return () => {
    removeClient(sessionId, controller);
  };
}

export function removeClient(sessionId: string, controller: SSEController): void {
  const sessionClients = clients.get(sessionId);
  if (!sessionClients) return;

  sessionClients.delete(controller);
  totalClients--;

  if (sessionClients.size === 0) {
    clients.delete(sessionId);
    const timer = idleTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      idleTimers.delete(sessionId);
    }
  }
}

function sendEvent(controller: SSEController, event: string, data: string): void {
  try {
    controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${data}\n\n`));
  } catch {
    // client disconnected
  }
}

export function notifyStepChange(sessionId: string, currentStep: number): void {
  const sessionClients = clients.get(sessionId);
  if (!sessionClients) return;

  resetIdleTimer(sessionId);

  const payload = JSON.stringify({ type: 'step', currentStep });
  Array.from(sessionClients).forEach((controller) => {
    sendEvent(controller, 'step', payload);
  });
}

export function broadcastToSession(
  sessionId: string,
  data: { message: string; messageType: 'message' | 'timer' | 'sticky'; duration?: number },
): void {
  const sessionClients = clients.get(sessionId);
  if (!sessionClients) return;

  resetIdleTimer(sessionId);

  const payload = JSON.stringify({ type: 'broadcast', ...data });
  Array.from(sessionClients).forEach((controller) => {
    sendEvent(controller, 'broadcast', payload);
  });
}

function resetIdleTimer(sessionId: string): void {
  const timer = idleTimers.get(sessionId);
  if (timer) clearTimeout(timer);

  idleTimers.set(
    sessionId,
    setTimeout(() => {
      const sessionClients = clients.get(sessionId);
      if (!sessionClients) return;

      Array.from(sessionClients).forEach((controller) => {
        try { controller.close(); } catch { /* already closed */ }
      });

      clients.delete(sessionId);
      idleTimers.delete(sessionId);
    }, IDLE_TIMEOUT_MS),
  );
}

export function getConnectedCount(sessionId: string): number {
  return clients.get(sessionId)?.size ?? 0;
}

export function getTotalConnectedCount(): number {
  return totalClients;
}

export function getIdleTimerSeconds(sessionId: string): number {
  return IDLE_TIMEOUT_MS / 1000;
}
