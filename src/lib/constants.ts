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

export const ANIMATION = {
  DURATIONS: {
    SLIDE: "0.8s",
    FADE: "0.5s",
    FLOAT: "3s",
  },
  EASINGS: {
    DEFAULT: "ease-out",
    INFINITE: "ease-in-out",
  },
} as const;

export const REVALIDATE = {
  PORTFOLIO: 60,
  GALLERY: 60,
  RESOURCES: 60,
  GAMES: 300,
  ADMIN: 0,
} as const;

export const ROUTES = {
  PUBLIC: {
    HOME: "/",
    PORTFOLIO: "/portfolio",
    GALLERY: "/gallery",
    RESOURCES: "/resources",
    GAMES: "/games",
  },
  ADMIN: {
    BASE: "/admin",
    PORTFOLIO: "/admin/portfolio",
    GALLERY: "/admin/gallery",
    RESOURCES: "/admin/resources",
    GAMES: "/admin/games",
    LOGIN: "/admin/login",
  },
} as const;

export const MONGO_EXPRESS = {
  DEFAULT_URL: "http://localhost:8081",
} as const;