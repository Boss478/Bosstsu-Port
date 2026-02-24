export const CONFIG = {
  // Authentication
  AUTH: {
    SESSION_DURATION: 3 * 60 * 60 * 1000, // in milliseconds
    IDLE_TIMEOUT: 30 * 60 * 1000, // AFK timeout in milliseconds
    COUNTDOWN_DURATION: 60, // seconds warning before logout
    COOKIE_NAME: 'admin-token',
  },

  // File Uploads
  UPLOAD: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB to allow large original files before compression
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
    ROOT_DIR: 'public/uploads',
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
    DESCRIPTION: 'เว็บไซต์ส่วนตัวสำหรับเก็บผลงาน กิจกรรม รูปภาพ สื่อการเรียนรู้ และเกมการศึกษา',
    EMAIL: 'boss478@example.com',
    GITHUB: 'https://github.com/Boss478',
  },
} as const;
