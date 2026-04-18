# Plan: Centralized Error Message System

**Version:** 1.5.8 | **Date:** 2026-04-07

## Context

The project has zero centralized error handling:
- **No Next.js error boundaries** — no `error.tsx`, `not-found.tsx`, or `global-error.tsx` anywhere in `src/app/`
- **Scattered error messages** — every action file returns hard-coded Thai/English strings like `'Unauthorized'`, `'ไม่สามารถสร้างรายการได้'`, etc.
- **Duplicate error strings** — `'Unauthorized'` appears in 7+ files (4 action files + 3 API routes)
- **Inconsistent error display** — Forms use styled divs, `DeleteButton` uses `alert()`
- **API routes** return `{ error: 'string' }` with varying formats (some as `Response.json`, some as `{ error }`)
- **No custom 404** — unmatched routes use Next.js default

**Goal:** Create a single `error_message` file (page + component + registry) to centralize all error codes, messages, and display logic for admin errors, user errors, DB errors, validation errors, and runtime errors.

---

## Architecture

### Layer 1: Error Code Registry (`src/lib/errors.ts`)

Centralizes all error codes, messages, and helper functions.

```
src/lib/errors.ts
  ├── ERROR_CODES (const map: name => HTTP code)
  ├── ERROR_MESSAGES (const map: HTTP code => { th, en, category, icon })
  ├── getErrorMessage(code, lang?) => string
  ├── actionError(code, detail?) => { error: string }
  └── type AppError = { code: number; message: string }
```

Categories: AUTH, VALIDATION, DATABASE, UPLOAD, RATE_LIMIT, SERVER

### Layer 2: Reusable Error Display Component (`src/components/ErrorMessage.tsx`)

Consistent error UI used across admin forms, DeleteButton, login, and error pages.

```
src/components/ErrorMessage.tsx
  ├── Accepts: code, icon (Flaticon class), message
  ├── Variants: "inline" (for forms, small), "full" (for error pages)
  └── Uses existing Flaticon icon system (fi-sr-*)
```

### Layer 3: Next.js Error Boundaries & Pages

```
src/app/error_message/page.tsx    <- Dedicated route for viewing errors
src/app/error.tsx                  <- Root runtime error boundary (Next.js convention)
src/app/not-found.tsx              <- Custom 404 page
src/app/admin/error.tsx            <- Admin-scoped error boundary
src/app/(website)/error.tsx        <- Website-scoped error boundary
```

Note: `error_message/page.tsx` is the actual page the user requested — serves as a centralized error display route.

### Layer 4: Update Existing Files

Replace scattered error strings with centralized calls.

---

## Step 1: Create `src/lib/errors.ts`

```typescript
export const ERROR_CODES = {
  AUTH_UNAUTHORIZED: 401,
  AUTH_TOKEN_EXPIRED: 419,
  RATE_LOCKED: 429,
  VALIDATION_FAILED: 422,
  DB_ERROR: 500,
  DB_CONNECTION_ERROR: 503,
  UPLOAD_FAILED: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;

type ErrorEntry = {
  th: string;
  en: string;
  category: string;
  icon: string; // Flaticon class
};

export const ERROR_MESSAGES: Record<number, ErrorEntry> = {
  400: {
    th: 'ข้อมูลไม่ถูกต้อง',
    en: 'Bad Request',
    category: 'REQUEST',
    icon: 'fi-sr-wrong',
  },
  401: {
    th: 'ไม่ได้รับอนุญาต โปรดเข้าสู่ระบบ',
    en: 'Unauthorized',
    category: 'AUTH',
    icon: 'fi-sr-lock',
  },
  403: {
    th: 'ไม่มีสิทธิ์เข้าถึงหน้านี้',
    en: 'Forbidden',
    category: 'AUTH',
    icon: 'fi-sr-ban',
  },
  404: {
    th: 'ไม่พบหน้าที่ต้องการ',
    en: 'Page Not Found',
    category: 'REQUEST',
    icon: 'fi-sr-search-minus',
  },
  419: {
    th: 'เซสชันหมดอายุ โปรดเข้าสู่ระบบอีกครั้ง',
    en: 'Session Expired',
    category: 'AUTH',
    icon: 'fi-sr-time-past',
  },
  422: {
    th: 'ข้อมูลไม่ถูกต้อง โปรดตรวจสอบ',
    en: 'Validation Failed',
    category: 'VALIDATION',
    icon: 'fi-sr-exclamation',
  },
  429: {
    th: 'ระบบถูกล็อกชั่วคราว โปรดลองอีกครั้งใน 15 นาที',
    en: 'Too Many Attempts',
    category: 'RATE_LIMIT',
    icon: 'fi-sr-lock',
  },
  500: {
    th: 'เกิดข้อผิดพลาดของระบบ',
    en: 'Internal Server Error',
    category: 'SERVER',
    icon: 'fi-sr-bug',
  },
  503: {
    th: 'ไม่สามารถเชื่อมต่อฐานข้อมูล',
    en: 'Database Unavailable',
    category: 'DATABASE',
    icon: 'fi-sr-database',
  },
};

export function getErrorMessage(code: number, lang: 'th' | 'en' = 'th'): string {
  return ERROR_MESSAGES[code]?.[lang] ?? ERROR_MESSAGES[500][lang];
}

export function getErrorIcon(code: number): string {
  return ERROR_MESSAGES[code]?.icon ?? ERROR_MESSAGES[500].icon;
}

export function getErrorCategory(code: number): string {
  return ERROR_MESSAGES[code]?.category ?? 'SERVER';
}

export function actionError(message: string): { error: string } {
  return { error: message };
}
```

---

## Step 2: Create `src/components/ErrorMessage.tsx`

Two variants:
- **`inline`** (default) — Small card for forms: rounded div with icon + text
- **`full`** — Centered full-page error display with icon, message, code, reset/action buttons

```tsx
interface ErrorMessageProps {
  message: string;
  code?: number;
  variant?: 'inline' | 'full';
  icon?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

// ... component with Flaticon icon, styled consistently ...
```

---

## Step 3: Create Error Boundaries & Pages

### `src/app/error_message/page.tsx`

Dedicated route: `/error_message` — accepts `?code=401&msg=custom` params.
- Reads search params, resolves via `getErrorMessage(code)` if no custom msg
- Uses `full` variant of ErrorMessage component
- Has "กลับสู่หน้าหลัก" (Back to Home) link

### `src/app/error.tsx`

Next.js runtime error boundary. Catches unhandled errors in any route.
- `'use client'` — receives `error` and `reset` props
- Maps error messages/categories to display via ErrorMessage `full` variant
- Has retry/reset button

### `src/app/not-found.tsx`

Custom 404 page.
- Server component
- Uses `getErrorMessage(404)` for both languages
- Has link back to home and previous page (JS history)

### `src/app/admin/error.tsx`

Admin-scoped error boundary.
- Same pattern as root error.tsx but themed for admin
- Has "กลับสู่หน้าหลัก Admin" link → `/admin`

### `src/app/(website)/error.tsx`

Website-scoped error boundary.
- Themed for public site
- Has links to home and portfolio/gallery pages

---

## Step 4: Update All Action Files to Use `src/lib/errors.ts`

**Pattern:** `return { error: 'Unauthorized' }` → `return actionError(getErrorMessage(ERROR_CODES.AUTH_UNAUTHORIZED))`

### Files to update:

| File | Count of replacements |
|------|----------------------|
| `src/app/admin/portfolio/actions.ts` | 6 (`Unauthorized`×3, `create×1, update×1, delete×1`) |
| `src/app/admin/gallery/actions.ts` | 6 (`Unauthorized`×3, `create×1, update×1, delete×1`) |
| `src/app/admin/resources/actions.ts` | 6 (`Unauthorized`×3, `create×1, update×1, delete×1`) |
| `src/app/admin/games/actions.ts` | 6 (`Unauthorized`×3, `create×1, update×1, delete×1`) |
| `src/app/admin/login/actions.ts` | 3 (wrong password, system error, rate lock) |
| `src/app/api/upload/route.ts` | 4 (`Unauthorized`, `no file`, `invalid folder`, `file too large`) |
| `src/app/api/pyodide-input/route.ts` | 4 (`Unauthorized`×2, `invalid request`, `invalid input`) |
| `src/app/api/process-words/route.ts` | 2 (`Unauthorized`, processing error) |

Also update:
- `src/components/admin/DeleteButton.tsx` — Replace `alert(result.error)` with error display
- `src/components/admin/PortfolioForm.tsx` — Replace inline error div with ErrorMessage component (line 225-228)
- `src/app/admin/login/page.tsx` — Replace inline error div (line 46-51) with ErrorMessage component

---

## Files Inventory

**Create (new):**
- `src/lib/errors.ts` — Error codes, messages, helpers
- `src/components/ErrorMessage.tsx` — Reusable error display component
- `src/app/error_message/page.tsx` — Dedicated `/error_message` route
- `src/app/error.tsx` — Root Next.js error boundary
- `src/app/not-found.tsx` — Custom 404 page
- `src/app/admin/error.tsx` — Admin-scoped error boundary
- `src/app/(website)/error.tsx` — Website-scoped error boundary

**Modify (existing):**
- `src/app/admin/portfolio/actions.ts` — Import `src/lib/errors.ts`, replace error strings
- `src/app/admin/gallery/actions.ts` — Import `src/lib/errors.ts`, replace error strings
- `src/app/admin/resources/actions.ts` — Import `src/lib/errors.ts`, replace error strings
- `src/app/admin/games/actions.ts` — Import `src/lib/errors.ts`, replace error strings
- `src/app/admin/login/actions.ts` — Import `src/lib/errors.ts`, replace error strings
- `src/app/api/upload/route.ts` — Import `src/lib/errors.ts`, replace error strings
- `src/app/api/pyodide-input/route.ts` — Import `src/lib/errors.ts`, replace error strings
- `src/app/api/process-words/route.ts` — Import `src/lib/errors.ts`, replace error strings
- `src/components/admin/DeleteButton.tsx` — Replace `alert()` with ErrorMessage
- `src/components/admin/PortfolioForm.tsx` — Replace inline error div with ErrorMessage
- `src/app/admin/login/page.tsx` — Replace inline error div with ErrorMessage

---

## Verification

1. **Dev server:** `npm run dev` — check no TypeScript errors
2. **Error boundary:** Visit any page, then trigger an error — should show `error.tsx` instead of blank page
3. **404 page:** Visit `/nonexistent-route` — should show custom 404 with Thai message
4. **Error message page:** Visit `/error_message?code=401` — should show auth error message
5. **Admin login:** Try wrong password — should show error via ErrorMessage component
6. **Admin CRUD:** Test create/update/delete — errors still display correctly
7. **Delete confirmations:** DeleteButton should no longer use `alert()`

## Versioning

- Bump `package.json`: `1.5.8` → `1.5.9`
- Add `changelog.md` entry with `+` and `*` symbols
