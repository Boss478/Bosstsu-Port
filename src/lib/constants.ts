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

export const TYPE_OPTIONS = [
  { value: 'Article', label: 'บทความ', mode: 'text', accept: 'text/markdown' },
  { value: 'Presentation', label: 'สไลด์', mode: 'file', accept: '.pdf,.ppt,.pptx' },
  { value: 'Video', label: 'วิดีโอ', mode: 'file', accept: 'video/*' },
  { value: 'Audio', label: 'เสียง', mode: 'file', accept: 'audio/*' },
  { value: 'Image', label: 'รูปภาพ', mode: 'file', accept: 'image/*' },
  { value: 'Document', label: 'เอกสาร', mode: 'file', accept: '.pdf,.doc,.docx' },
  { value: 'Interactive', label: 'แบบฝึกหัด', mode: 'text' },
  { value: 'External', label: 'ลิงก์ภายนอก', mode: 'text', accept: 'url' },
] as const;

export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  Article: ['text/markdown'],
  Presentation: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  Video: ['video/mp4', 'video/webm', 'video/ogg'],
  Audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  Image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  Document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  Interactive: [],
  External: [],
};
