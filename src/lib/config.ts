import pkg from '../../package.json';

export const CONFIG = {

  // ─── Authentication ───────────────────────────────────────────────────
  AUTH: {
    SESSION_DURATION: 3 * 60 * 60 * 1000,  // milliseconds — total session lifetime
    IDLE_TIMEOUT: 30 * 60 * 1000,           // milliseconds — countdown to logout starts after idle
    COUNTDOWN_DURATION: 60,                 // seconds — warning countdown before forced logout
    COOKIE_NAME: 'admin-token',
  },

  // ─── Private Section Auth ────────────────────────────────────────────
  PRIVATE_AUTH: {
    SESSION_DURATION: 24 * 60 * 60 * 1000,  // 24h — personal tool
    COOKIE_NAME: 'private-token',
  },

  // ─── File Uploads ─────────────────────────────────────────────────────
  UPLOAD: {
    MAX_SIZE: 30 * 1024 * 1024,             // bytes — must match next.config.ts bodySizeLimit
    MAX_SIZE_MB: '30mb',                    // string form for next.config.ts

    // MIME types accepted at upload (used before any image processing)
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'] as const,

    // Folders the upload API accepts — add/remove here to control allowed destinations
    ALLOWED_FOLDERS: ['portfolio', 'gallery', 'portfolio/gallery', 'misc', 'learning', 'tools', 'games'] as const,

    // Folders that get converted to WebP for better compression — others save as JPEG
    FOLDERS_CONVERT_TO_WEBP: ['portfolio', 'gallery/covers', 'games', 'learning'] as const,

    ROOT_DIR: 'public/uploads',             // filesystem path — base directory for saved uploads
  },

  // ─── Image Processing (sharp / canvas) ────────────────────────────────
  IMAGE_PROCESSING: {
    JPEG_QUALITY: 75,                       // 0–100 — sharp JPEG output quality after upload
    WEBP_QUALITY: 75,                       // 0–100 — sharp WebP output quality after upload
    JPEG_QUALITY_FRACTION: 0.9,             // 0.0–1.0 — canvas.toBlob() quality for image cropping in admin
    USE_MOZJPEG: true,                      // enable MozJPEG encoder (~20-30% smaller JPEGs at same quality)
    CONCURRENT_SHARP: 1,                    // count — sharp worker threads; keep at 1 on low-CPU VPS
  },

  // ─── HEIC/HEIF Support (Apple photos) ─────────────────────────────────
  HEIC: {
    ENABLED: true,                          // set false to reject HEIC uploads entirely
    OUTPUT_FORMAT: 'JPEG' as const,         // 'JPEG' or 'PNG' — target format after HEIC conversion
    OUTPUT_QUALITY: 0.9,                    // 0.0–1.0 — heic-convert library quality after conversion
    EXTENSIONS: ['.heic', '.heif'] as const,// detected by file extension (catches wrong MIME types from Safari/iOS)
  },

  // ─── Database ─────────────────────────────────────────────────────────
  DB: {
    TIMEOUTS: {
      SERVER_SELECTION: 5000,
      SOCKET: 30000,
      CONNECT: 5000,
    },
    POOL: {
      MAX: 3,
      MIN: 1,
    },
  },

  // ─── Validation ───────────────────────────────────────────────────────
  VALIDATION: {
    TITLE_MAX: 100,
    DESCRIPTION_MAX: 500,
    SLUG_REGEX: /^[a-z0-9-]+$/,
    SESSION_TITLE_MAX: 100,
  },

  // ─── Revalidation ─────────────────────────────────────────────────────
  REVALIDATION: {
    DETAIL_PAGE: 60,
  },

  // ─── Pagination ───────────────────────────────────────────────────────
  PAGINATION: {
    DEFAULT_LIMIT: 10,                      // items per page — admin list pages
    SIZE_OPTIONS: [10, 20, 25, 50, 75, 100] as const,
    DASHBOARD_RECENT: 5,                    // items — recently updated on admin dashboard
    PORTFOLIO_RECENT: 5,                    // items — recent items on portfolio detail page
    PORTFOLIO_RELATED: 3,                   // items — related items on portfolio detail page
    PORTFOLIO_PUBLIC: 15,                   // items per page — public portfolio list
    GALLERY_PUBLIC: 15,                     // items per page — public gallery list
    LEARNING_PUBLIC: 15,                    // items per page — public resources list
    GAMES_PUBLIC: 15,                       // items per page — public games list
    POLL_LIMIT: 50,                         // items — poll results API limit
    RECENT_RESOURCES: 5,                    // items — recent resources on detail page
  },

  // ─── Finance Tracker (Private Section) ─────────────────────────────────
  FINANCE: {
    CATEGORIES: {
      income: [
        { value: 'Salary', label: 'Salary (เงินเดือน)' },
        { value: 'Bonus', label: 'Bonus (โบนัส)' },
        { value: 'Side Income', label: 'Side Income (รายได้เสริม)' },
        { value: 'Investment', label: 'Investment (การลงทุน)' },
        { value: 'Other', label: 'Other (อื่นๆ)' },
      ] as const,
      expense: [
        { value: 'Fixed Cost', label: 'Fixed Cost (ค่าใช้จ่ายคงที่)' },
        { value: 'Daily Cost', label: 'Daily Cost (ค่าใช้จ่ายผันแปร)' },
        { value: 'Debt', label: 'Debt (หนี้สิน)' },
        { value: 'Savings & Investments', label: 'Savings & Investments (ออมและการลงทุน)' },
        { value: 'Other', label: 'Other (อื่นๆ)' },
      ] as const,
    },
    BILLING_CYCLES: ['monthly', 'yearly', 'weekly', 'quarterly'] as const,
    MONTHLY_NORMALIZER: { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 } as const,
  } as const,

  // ─── Rate Limiting ────────────────────────────────────────────────────
  RATE_LIMIT: {
    MAX_ATTEMPTS: 5,                    // failed attempts before lockout
    WINDOW_MS: 15 * 60 * 1000,          // 15-minute sliding window
    LOCKOUT_MS: 15 * 60 * 1000,         // 15-minute lockout duration
    MAX_IPS: 20,                         // max tracked IPs (evict oldest when full)
  },

  // ─── Learning Tools ──────────────────────────────────────────────────
  TOOLS: {
    SESSION_CODE_LENGTH: 5,
    POLL_INTERVAL_MS: 10000,
    RATE_LIMIT_PER_MINUTE: 10,
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_FILE_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'text/plain',
    ] as const,
    SESSION_AUTO_CLOSE_HOURS: 24,
    PAGINATION: {
      TOOLS_PUBLIC: 50,
    },
  },

  // ─── Site Metadata ────────────────────────────────────────────────────
  SITE: {
    NAME: 'Boss478',
    VERSION: pkg.version,
    TITLE: 'Boss478 | Portfolio',
    DESCRIPTION: 'เว็บไซต์ส่วนตัวสำหรับเก็บผลงาน กิจกรรม รูปภาพ สื่อการเรียนรู้ และเกมการศึกษา',
    EMAIL: 'bossnt45@gmail.com',
    GITHUB: 'https://github.com/Boss478',
  },
} as const;

export function getCategoryLabel(value: string): string {
  const all = [...CONFIG.FINANCE.CATEGORIES.income, ...CONFIG.FINANCE.CATEGORIES.expense];
  for (const cat of all) {
    if (cat.value === value) return cat.label;
  }
  return value;
}
