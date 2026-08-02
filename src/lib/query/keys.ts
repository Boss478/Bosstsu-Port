export const stockKeys = {
  all: ['stocks'] as const,
  quotes: () => [...stockKeys.all, 'quotes'] as const,
  history: (symbol: string, period: string) =>
    [...stockKeys.all, 'history', symbol, period] as const,
  holdings: () => [...stockKeys.all, 'holdings'] as const,
  watchlist: () => [...stockKeys.all, 'watchlist'] as const,
} as const;

export const financeKeys = {
  all: ['finance'] as const,
  budgets: (month: string) => [...financeKeys.all, 'budgets', month] as const,
  transactions: (filters?: Record<string, string>) =>
    [...financeKeys.all, 'transactions', filters] as const,
  subscriptions: () => [...financeKeys.all, 'subscriptions'] as const,
} as const;

export const toolKeys = {
  all: ['tools'] as const,
  poll: (sessionId: string, stepIndex?: number) =>
    [...toolKeys.all, 'poll', sessionId, stepIndex ?? 'all'] as const,
  participants: (sessionId: string) => [...toolKeys.all, 'participants', sessionId] as const,
} as const;

export const analyticsKeys = {
  all: ['analytics'] as const,
  stats: () => [...analyticsKeys.all, 'stats'] as const,
} as const;
