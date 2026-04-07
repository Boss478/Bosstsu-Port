export const CONFIG = {

  // ─── Authentication ───────────────────────────────────────────────────
  AUTH: {
    SESSION_DURATION: 3 * 60 * 60 * 1000,  // milliseconds — total session lifetime
    IDLE_TIMEOUT: 30 * 60 * 1000,           // milliseconds — countdown to logout starts after idle
    COUNTDOWN_DURATION: 60,                 // seconds — warning countdown before forced logout
    COOKIE_NAME: 'admin-token',
  },

  // ─── File Uploads ─────────────────────────────────────────────────────
  UPLOAD: {
    MAX_SIZE: 30 * 1024 * 1024,             // bytes — must match next.config.ts bodySizeLimit

    // MIME types accepted at upload (used before any image processing)
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'] as const,

    // Folders the upload API accepts — add/remove here to control allowed destinations
    ALLOWED_FOLDERS: ['portfolio', 'gallery', 'portfolio/gallery', 'misc'] as const,

    // Folders that get converted to WebP for better compression — others save as JPEG
    FOLDERS_CONVERT_TO_WEBP: ['portfolio'] as const,

    ROOT_DIR: 'public/uploads',             // filesystem path — base directory for saved uploads
  },

  // ─── Image Processing (sharp / canvas) ────────────────────────────────
  IMAGE_PROCESSING: {
    JPEG_QUALITY: 80,                       // 0–100 — sharp JPEG output quality after upload
    WEBP_QUALITY: 80,                       // 0–100 — sharp WebP output quality after upload
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

  // ─── Pagination ───────────────────────────────────────────────────────
  PAGINATION: {
    DEFAULT_LIMIT: 10,                      // items per page — admin list pages
    DASHBOARD_RECENT: 5,                    // items — recently updated on admin dashboard
    PORTFOLIO_RECENT: 5,                    // items — recent items on portfolio detail page
    PORTFOLIO_RELATED: 3,                   // items — related items on portfolio detail page
    PORTFOLIO_PUBLIC: 15,                   // items per page — public portfolio list
    GALLERY_PUBLIC: 15,                     // items per page — public gallery list
    LEARNING_PUBLIC: 15,                    // items per page — public resources list
  },

  // ─── Rate Limiting ────────────────────────────────────────────────────
  RATE_LIMIT: {
    MAX_ATTEMPTS: 5,                    // failed attempts before lockout
    WINDOW_MS: 15 * 60 * 1000,          // 15-minute sliding window
    LOCKOUT_MS: 15 * 60 * 1000,         // 15-minute lockout duration
    MAX_IPS: 20,                         // max tracked IPs (evict oldest when full)
  },

  // ─── Site Metadata ────────────────────────────────────────────────────
  SITE: {
    NAME: 'Boss478',
    TITLE: 'Boss478 | Portfolio',
    DESCRIPTION: 'เว็บไซต์ส่วนตัวสำหรับเก็บผลงาน กิจกรรม รูปภาพ สื่อการเรียนรู้ และเกมการศึกษา',
    EMAIL: 'bossnt45@gmail.com',
    GITHUB: 'https://github.com/Boss478',
  },
} as const;
