export type SSEController = ReadableStreamDefaultController;

export interface StepChangeEvent {
  type: 'step';
  currentStep: number;
  kicked: boolean;
  kickedTokens: string[];
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
const clientMeta = new Map<SSEController, { ip?: string; token?: string }>();
const ipCounts = new Map<string, number>();

const MAX_CLIENTS_PER_SESSION = 50;
const MAX_TOTAL_CLIENTS = 150;
export const MAX_CLIENTS_PER_IP = 8;
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

let totalClients = 0;

export interface AddClientOptions {
  ip?: string;
  token?: string;
}

export interface AddClientResult {
  cleanup: () => void;
  accepted: boolean;
}

function addClientInternal(
  sessionId: string,
  controller: SSEController,
  opts?: AddClientOptions,
): AddClientResult {
  if (totalClients >= MAX_TOTAL_CLIENTS) {
    controller.error(new Error('Server at capacity'));
    return { cleanup: () => {}, accepted: false };
  }

  if (opts?.ip && (ipCounts.get(opts.ip) ?? 0) >= MAX_CLIENTS_PER_IP) {
    controller.error(new Error('Too many connections from this IP'));
    return { cleanup: () => {}, accepted: false };
  }

  if (!clients.has(sessionId)) {
    clients.set(sessionId, new Set());
  }

  const sessionClients = clients.get(sessionId)!;

  if (sessionClients.size >= MAX_CLIENTS_PER_SESSION) {
    controller.error(new Error('Session at capacity'));
    return { cleanup: () => {}, accepted: false };
  }

  sessionClients.add(controller);
  totalClients++;

  if (opts?.ip || opts?.token) {
    clientMeta.set(controller, { ip: opts?.ip, token: opts?.token });
  }
  if (opts?.ip) {
    ipCounts.set(opts.ip, (ipCounts.get(opts.ip) ?? 0) + 1);
  }

  return {
    cleanup: () => {
      removeClient(sessionId, controller);
    },
    accepted: true,
  };
}

/**
 * Legacy addClient — kept callable-return for existing callers/tests.
 * On rejection it errors the controller and returns a no-op cleanup.
 */
export function addClient(
  sessionId: string,
  controller: SSEController,
  opts?: AddClientOptions,
): () => void {
  return addClientInternal(sessionId, controller, opts).cleanup;
}

/**
 * Result-aware variant — callers must honor `accepted` before streaming.
 */
export function tryAddClient(
  sessionId: string,
  controller: SSEController,
  opts?: AddClientOptions,
): AddClientResult {
  return addClientInternal(sessionId, controller, opts);
}

export function removeClient(sessionId: string, controller: SSEController): void {
  const sessionClients = clients.get(sessionId);
  if (!sessionClients) return;

  if (!sessionClients.delete(controller)) return;
  totalClients--;

  const meta = clientMeta.get(controller);
  if (meta) {
    if (meta.ip) {
      const count = ipCounts.get(meta.ip);
      if (count !== undefined) {
        if (count <= 1) ipCounts.delete(meta.ip);
        else ipCounts.set(meta.ip, count - 1);
      }
    }
    clientMeta.delete(controller);
  }

  if (sessionClients.size === 0) {
    clients.delete(sessionId);
    const timer = idleTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      idleTimers.delete(sessionId);
    }
  }
}

function isBackpressured(controller: SSEController): boolean {
  return typeof controller.desiredSize === 'number' && controller.desiredSize < 0;
}

function sendEvent(controller: SSEController, event: string, data: string): void {
  try {
    controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${data}\n\n`));
  } catch {
    // client disconnected
  }
}

/**
 * Backpressure guard: slow consumers (desiredSize < 0) are dropped instead of
 * buffering unboundedly in the stream's internal queue.
 */
function sendOrDrop(
  sessionId: string,
  controller: SSEController,
  event: string,
  data: string,
): void {
  if (isBackpressured(controller)) {
    removeClient(sessionId, controller);
    try {
      controller.close();
    } catch {
      /* already closed */
    }
    return;
  }
  sendEvent(controller, event, data);
}

function isClientStillConnected(sessionId: string, controller: SSEController): boolean {
  return clients.get(sessionId)?.has(controller) ?? false;
}

export function notifyStepChange(
  sessionId: string,
  currentStep: number,
  kickedTokens: string[] = [],
): void {
  const sessionClients = clients.get(sessionId);
  if (!sessionClients) return;

  resetIdleTimer(sessionId);

  // Generic broadcast — never includes other clients' tokens.
  const payload = JSON.stringify({
    type: 'step',
    currentStep,
    kicked: false,
    kickedTokens: [],
  });
  Array.from(sessionClients).forEach((controller) => {
    sendOrDrop(sessionId, controller, 'step', payload);
  });

  // Targeted kick: only the kicked client receives its own token.
  if (kickedTokens.length > 0) {
    for (const token of kickedTokens) {
      for (const controller of Array.from(sessionClients)) {
        if (
          clientMeta.get(controller)?.token === token &&
          isClientStillConnected(sessionId, controller)
        ) {
          sendOrDrop(
            sessionId,
            controller,
            'step',
            JSON.stringify({ type: 'step', currentStep, kicked: true, kickedTokens: [token] }),
          );
        }
      }
    }
  }
}

export function notifyResponsesChange(sessionId: string): void {
  const sessionClients = clients.get(sessionId);
  if (!sessionClients) return;

  resetIdleTimer(sessionId);

  const payload = JSON.stringify({ type: 'responses' });
  Array.from(sessionClients).forEach((controller) => {
    sendOrDrop(sessionId, controller, 'responses', payload);
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
    sendOrDrop(sessionId, controller, 'broadcast', payload);
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
        try {
          controller.close();
        } catch {
          /* already closed */
        }
        removeClient(sessionId, controller);
      });

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

export function getIpConnectedCount(ip: string): number {
  return ipCounts.get(ip) ?? 0;
}

export function getIdleTimerSeconds(): number {
  return IDLE_TIMEOUT_MS / 1000;
}
