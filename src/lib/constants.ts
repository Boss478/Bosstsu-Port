export const DB = {
  TIMEOUTS: {
    SERVER_SELECTION: 5000,
    SOCKET: 30000,
    CONNECT: 5000,
  },
  POOL: {
    MAX: 3,
    MIN: 1,
  },
} as const;
