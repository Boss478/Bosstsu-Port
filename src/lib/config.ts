export const CONFIG = {
  // Authentication
  AUTH: {
    SESSION_DURATION: 60 * 60 * 1000, // 1 hour in milliseconds
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
  },
} as const;
