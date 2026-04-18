export const ERRORS = {
  // HTTP Errors (key = HTTP status code)
  '400': { http: 400, message: "คำขอไม่ถูกต้อง", translation: "Bad Request" },
  '401': { http: 401, message: "กรุณาเข้าสู่ระบบ", translation: "Unauthorized" },
  '403': { http: 403, message: "ไม่มีสิทธิ์เข้าถึง", translation: "Forbidden" },
  '404': { http: 404, message: "ไม่พบข้อมูล", translation: "Not Found" },
  '413': { http: 413, message: "ไฟล์มีขนาดใหญ่เกินไป", translation: "Payload Too Large" },
  '415': { http: 415, message: "ชนิดไฟล์ไม่ถูกต้อง", translation: "Unsupported Media Type" },
  '422': { http: 422, message: "ข้อมูลไม่ถูกต้อง", translation: "Validation Error" },
  '429': { http: 429, message: "ระบบถูกล็อกชั่วคราว", translation: "Too Many Requests" },
  '500': { http: 500, message: "เกิดข้อผิดพลาดของระบบ", translation: "Internal Server Error" },
  '502': { http: 502, message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้", translation: "Bad Gateway" },
  '503': { http: 503, message: "บริการไม่พร้อมใช้งาน", translation: "Service Unavailable" },

  // App Errors (key = custom code)
  U01: { http: 413, message: "ไฟล์มีขนาดใหญ่เกินไป", translation: "File is too large" },
  U02: { http: 415, message: "ชนิดไฟล์ไม่ถูกต้อง", translation: "Invalid file type" },
  U03: { http: 400, message: "ไฟล์ปกอร์ไม่ถูกต้อง", translation: "Cover image required" },
  U04: { http: 400, message: "โฟลเดอร์ไม่ถูกต้อง", translation: "Invalid folder" },
  U05: { http: 400, message: "ไม่พบไฟล์", translation: "File not found" },

  A01: { http: 401, message: "รหัสผ่านไม่ถูกต้อง", translation: "Invalid password" },
  A02: { http: 429, message: "ระบบถูกล็อกชั่วคราว โปรดลองอีกครั้งใน 15 นาที", translation: "Rate limited" },

  DB01: { http: 500, message: "ไม่สามารถสร้างข้อมูลได้", translation: "Cannot create data" },
  DB02: { http: 500, message: "ไม่สามารถอัปเดตข้อมูลได้", translation: "Cannot update data" },
  DB03: { http: 500, message: "ไม่สามารถลบข้อมูลได้", translation: "Cannot delete data" },

  T01: { http: 400, message: "แท็กว่าง", translation: "Empty tag" },
  T02: { http: 500, message: "ไม่สามารถเพิ่มแท็กได้", translation: "Failed to add tag" },
  T03: { http: 404, message: "ไม่พบแท็ก", translation: "Tag not found" },

  P01: { http: 400, message: "คำขอไม่ถูกต้อง", translation: "Invalid request" },
  P02: { http: 400, message: "คำนำเข้าไม่ถูกต้อง", translation: "Invalid input" },
} as const;

export type ErrorKey = keyof typeof ERRORS;

export interface ErrorResponse {
  code: string;
  httpStatus: number;
  message: string;
  translation: string;
}

export function getError(key: string): ErrorResponse {
  const err = ERRORS[key as ErrorKey] as { http: number; message: string; translation: string };
  if (!err) {
    return {
      code: `ERROR_${key} [500]`,
      httpStatus: 500,
      message: "เกิดข้อผิดพลาดของระบบ",
      translation: "Internal Server Error",
    };
  }

  const httpStatus = err.http;
  const code = key.toString().includes(key.match(/[0-9]/)?.at(0) || '') && parseInt(key) < 1000
    ? `ERROR_${key}`
    : `ERROR_${key}`;

  return {
    code: `${code} [${httpStatus}]`,
    httpStatus,
    message: err.message,
    translation: err.translation,
  };
}

export function createErrorResponse(key: string): ErrorResponse {
  return getError(key);
}