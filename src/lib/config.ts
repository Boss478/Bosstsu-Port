export const CONFIG = {
  // Authentication
  AUTH: {
    SESSION_DURATION: 3 * 60 * 60 * 1000,
    IDLE_TIMEOUT: 30 * 60 * 1000,
    COUNTDOWN_DURATION: 60,
    COOKIE_NAME: 'admin-token',
  },

  // File Uploads
  UPLOAD: {
    MAX_SIZE: 30 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'] as const,
    ALLOWED_FOLDERS: ['portfolio', 'gallery', 'portfolio/gallery', 'misc'] as const,
    FOLDERS_CONVERT_TO_WEBP: ['portfolio'] as const,
    ROOT_DIR: 'public/uploads',
  },

  // Image Processing
  IMAGE_PROCESSING: {
    JPEG_QUALITY: 80,
    WEBP_QUALITY: 80,
    JPEG_QUALITY_FRACTION: 0.9,
    USE_MOZJPEG: true,
    CONCURRENT_SHARP: 1,
  },

  // HEIC/HEIF Support
  HEIC: {
    ENABLED: true,
    OUTPUT_FORMAT: 'JPEG' as const,
    OUTPUT_QUALITY: 0.9,
    EXTENSIONS: ['.heic', '.heif'] as const,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    DASHBOARD_RECENT: 5,
    PORTFOLIO_RECENT: 5,
    PORTFOLIO_RELATED: 3,
  },

  // Site Metadata
  SITE: {
    NAME: 'Boss478',
    TITLE: 'Boss478 | Portfolio',
    DESCRIPTION: 'เว็บไซต์ส่วนตั่วสำหรับเก็บผลงาน กิจกรรม รูปภาพ สื่อการเรียนรู้ และเกมการศึกษา',
    EMAIL: 'bossnt45@gmail.com',
    GITHUB: 'https://github.com/Boss478',
  },
} as const;
