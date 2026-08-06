// @vitest-environment jsdom
/**
 * LawlibDock v2.1 (T10a + T12 — ADR-019 D1/D2/D3/D6/D9) contract tests.
 *
 * The dock is exercised THROUGH the full reader client:
 * `<ThemeProvider><LawlibReaderClient law={sampleLaw} /></ThemeProvider>`
 * (module-local wiring precedent — the dock is a real component importing the
 * reader's storage/theme state).
 *
 * Pinned here:
 * - Level 1 OPEN BY DEFAULT (T12 D9 — reversed D1 default-collapsed):
 *   panel renders on mount, ย่อ/X visible on Level 1, focus NOT stolen;
 *   `lawlib:dockCollapsed` memory: user collapse → next visit starts
 *   collapsed; expand clears it
 * - picker buttons SHOW CURRENT VALUES (16px / 1.8 / 100% / theme label)
 * - panel STAYS OPEN after actions (picker open, option picked) — no
 *   auto-collapse (D1)
 * - close paths: Esc (focus returns to the icon) · ย่อ button · X button —
 *   pointerdown-outside NO LONGER closes the dock panel (T12); the picker
 *   POPOVER still closes on outside click (scrutiny fix — separate handlers)
 * - pickers: click-to-expand popover (aria-expanded), DIRECT choice (no
 *   cycling), Esc closes the popover only
 * - T12 direction-aware layout: side positions (default bottom-right) =
 *   vertical Level-1 column + 2-col Level-2 grid; middle positions (top/
 *   bottom-center) = horizontal row + horizontal grid; mobile (≤639px) =
 *   full-width bottom sheet (open per default)
 * - T12 non-default value dots: picker button shows a blue dot when its
 *   value ≠ default; no dot at defaults
 * - T12 animation: expand/collapse slide+fade ~150ms, gated by
 *   settings.animateDock AND prefers-reduced-motion (tests default the
 *   reduced-motion stub ON → instant swaps, so close-path assertions stay
 *   synchronous; dedicated tests flip it OFF)
 * - bookmark: toggle + aria-pressed + count badge
 * - Level 2 "เพิ่มเติม": ALL tools + per-tool pin (the 8-position selector
 *   MOVED to the ⚙️ settings panel — T12c)
 * - T12c theme dot: baselines on the RESOLVED initial theme (OS-dark
 *   fallback users see no false dot on first visit)
 * - mobile-safe panel: max-h + overflow-y-auto
 *
 * jsdom gaps stubbed: matchMedia (query-aware: dark/mobile/reduced-motion),
 * IntersectionObserver (TocSidebar scroll-spy), localStorage (in-memory
 * store). `next/link` renders a plain <a> (no router in jsdom).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import LawlibReaderClient from '@/app/(website)/lawlib/[slug]/LawlibReaderClient';
import { ThemeProvider } from '@/components/ThemeProvider';
import sampleLawRaw from '@/data/lawlib/laws/sample.json';
import type { LawDoc } from '@/types/lawlib';

vi.mock('next/link', () => ({
  default: (props: { href: string; children?: ReactNode }) => (
    <a href={props.href}>{props.children}</a>
  ),
}));

const sampleLaw = sampleLawRaw as unknown as LawDoc;

/** In-memory localStorage stub (repo pattern: tests/unit/phonics/save.test.ts). */
function mockLocalStorage(): void {
  const store = new Map<string, string>();
  const stub = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((i: number) => [...store.keys()][i] ?? null),
    get length() {
      return store.size;
    },
  };
  vi.stubGlobal('localStorage', stub);
}

/**
 * Query-aware matchMedia. Defaults: light scheme, DESKTOP (not mobile),
 * reduced-motion ON (dock animations off → instant collapse keeps the
 * close-path assertions synchronous).
 */
function mockMatchMedia(opts?: { dark?: boolean; mobile?: boolean; reducedMotion?: boolean }) {
  const dark = opts?.dark ?? false;
  const mobile = opts?.mobile ?? false;
  const reducedMotion = opts?.reducedMotion ?? true;
  window.matchMedia = vi.fn((query: string) => {
    const matches = query.includes('(max-width: 639px)')
      ? mobile
      : query.includes('(prefers-reduced-motion: reduce)')
        ? reducedMotion
        : query.includes('(pointer: coarse)')
          ? false
          : query.includes('prefers-color-scheme: dark')
            ? dark
            : false;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  }) as unknown as typeof window.matchMedia;
}

/** jsdom has no IntersectionObserver — TocSidebar's scroll-spy needs it. */
class IntersectionObserverStub {
  readonly root: Element | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

/** The COLLAPSED tools icon (absent while the panel is open). */
const dockIcon = () => screen.getByRole('button', { name: 'เครื่องมืออ่าน' });
const dockPanel = () => document.getElementById('lawlib-dock-panel');
/** The panel header collapse button — VISIBLE on Level 1 (T12 fix). */
const collapseBtn = () => screen.getByRole('button', { name: 'ย่อแถบเครื่องมือ' });

/** T12c: the position grid moved into the ⚙️ settings picker — open it
 *  (เพิ่มเติม → ตั้งค่า) and click the named spot there. */
function clickPositionInSettings(label: string): void {
  fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
  fireEvent.click(screen.getByRole('button', { name: /^ตั้งค่า/ }));
  const picker = screen.getByRole('group', { name: 'ตั้งค่า' });
  fireEvent.click(within(picker).getByRole('button', { name: `ตำแหน่ง${label}` }));
}

beforeEach(() => {
  mockLocalStorage();
  mockMatchMedia();
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  document.documentElement.className = '';
  document.documentElement.removeAttribute('style');
  document.body.classList.remove('lawlib-immersive');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Render the reader inside ThemeProvider; flush the mount setTimeout(0). */
async function renderReader() {
  const utils = render(
    <ThemeProvider>
      <LawlibReaderClient law={sampleLaw} digestView={null} />
    </ThemeProvider>,
  );
  // The mount effect defers its first-article activation into setTimeout(0) —
  // let it settle inside act so no state update lands outside it.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  return utils;
}

describe('Dock v2.1 — Level 1 OPEN BY DEFAULT (T12)', () => {
  it('renders the panel on mount: no collapsed icon, ย่อ/X visible on Level 1', async () => {
    await renderReader();

    const panel = dockPanel();
    expect(panel).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'เครื่องมืออ่าน' })).toBeNull();
    // The collapse control lives in the shared panel header — VISIBLE on
    // Level 1 (T12 scrutiny fix), not only in Level 2.
    expect(collapseBtn().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'ปิดแถบเครื่องมือ' })).toBeTruthy();

    // The default curated row shows CURRENT values.
    expect(screen.getByRole('button', { name: /ธีม/ }).textContent).toContain('สว่าง');
    expect(screen.getByRole('button', { name: /ตัวอักษร/ }).textContent).toContain('16px');
    expect(screen.getByRole('button', { name: /บรรทัด/ }).textContent).toContain('1.8');
    expect(screen.getByRole('button', { name: /กว้าง/ }).textContent).toContain('100%');
    expect(screen.getByRole('button', { name: 'ที่คั่นหน้า' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ค้นหามาตรา' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'บันทึกของฉัน' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'เพิ่มเติม' })).toBeTruthy();
  });

  it('does NOT steal focus on the default-open mount', async () => {
    await renderReader();
    // The panel is open on load — focusing its first control would yank the
    // user's cursor away from the page content.
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'ค้นหามาตรา' }));
    expect(document.activeElement).not.toBe(collapseBtn());
  });

  it('dockCollapsed memory: stored "true" → starts collapsed (Level 0)', async () => {
    localStorage.setItem('lawlib:dockCollapsed', 'true');
    await renderReader();

    expect(dockPanel()).toBeNull();
    const icon = dockIcon();
    expect(icon.getAttribute('aria-expanded')).toBe('false');
    expect(icon.getAttribute('aria-controls')).toBe('lawlib-dock-panel');
    // No badge inside the collapsed icon (D1 — plain tools icon).
    expect(within(icon).queryByText(/^\d+$/)).toBeNull();
  });

  it('user expand clears the collapse memory; user collapse persists it', async () => {
    localStorage.setItem('lawlib:dockCollapsed', 'true');
    await renderReader();
    expect(dockPanel()).toBeNull();

    // Expand → memory cleared (next visit opens).
    fireEvent.click(dockIcon());
    expect(dockPanel()).not.toBeNull();
    expect(localStorage.getItem('lawlib:dockCollapsed')).toBe('false');

    // Collapse (ย่อ) → memory set (next visit starts collapsed).
    fireEvent.click(collapseBtn());
    expect(dockPanel()).toBeNull();
    expect(localStorage.getItem('lawlib:dockCollapsed')).toBe('true');
  });
});

describe('Dock v2.1 — Level 1 (expanded favorites)', () => {
  it('panel STAYS OPEN after opening a picker and after picking an option (no auto-collapse, D1)', async () => {
    await renderReader();
    expect(dockPanel()).not.toBeNull();

    // Open the theme picker → panel + popover both stay.
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    fireEvent.click(themeBtn);
    expect(themeBtn.getAttribute('aria-expanded')).toBe('true');
    expect(dockPanel()).not.toBeNull();
    // The picker popover is a labelled GROUP, not a nested dialog (a11y fix
    // #8 — it portals inside the dock's own dialog).
    expect(screen.getByRole('group', { name: 'ธีม' })).toBeTruthy();

    // DIRECT choice — pick ธีมมืด → applied immediately, still no collapse.
    fireEvent.click(screen.getByRole('button', { name: 'ธีมมืด' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(dockPanel()).not.toBeNull();
    // The picker button now shows the NEW current value.
    expect(themeBtn.textContent).toContain('มืด');
  });

  it('font size picker: −/+ steppers + preset chips change the value directly', async () => {
    await renderReader();
    const fontSizeBtn = screen.getByRole('button', { name: /ตัวอักษร/ });
    fireEvent.click(fontSizeBtn);
    expect(fontSizeBtn.getAttribute('aria-expanded')).toBe('true');

    // Preset chip (legacy 'l' → 18px).
    fireEvent.click(screen.getByRole('button', { name: 'ขนาดตัวอักษร 18px' }));
    expect(fontSizeBtn.textContent).toContain('18px');

    // Stepper +.
    fireEvent.click(screen.getByRole('button', { name: 'ตัวอักษรใหญ่ขึ้น' }));
    expect(fontSizeBtn.textContent).toContain('19px');
  });

  it('line-height + width pickers: sliders apply directly and show the value', async () => {
    await renderReader();

    const lineHeightBtn = screen.getByRole('button', { name: /บรรทัด/ });
    fireEvent.click(lineHeightBtn);
    const lhSlider = screen.getByRole('slider', { name: 'ความสูงบรรทัด' });
    fireEvent.change(lhSlider, { target: { value: '1.2' } });
    expect(lineHeightBtn.textContent).toContain('1.2');
    fireEvent.keyDown(document, { key: 'Escape' });

    const widthBtn = screen.getByRole('button', { name: /กว้าง/ });
    fireEvent.click(widthBtn);
    const widthSlider = screen.getByRole('slider', { name: 'ความกว้างเนื้อหา' });
    // Width slider runs 80-120% (step 1) — pick 110% and see it on the button.
    expect(widthSlider.getAttribute('min')).toBe('80');
    expect(widthSlider.getAttribute('max')).toBe('120');
    fireEvent.change(widthSlider, { target: { value: '110' } });
    expect(widthBtn.textContent).toContain('110%');
  });

  it('picker popover closes on Esc; the panel stays open (Esc cascades)', async () => {
    await renderReader();
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    fireEvent.click(themeBtn);
    expect(screen.getByRole('group', { name: 'ธีม' })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'ธีม' })).toBeNull();
    expect(dockPanel()).not.toBeNull();
  });

  it('bookmark button: toggle + aria-pressed + count badge', async () => {
    await renderReader();

    const bookmarkBtn = screen.getByRole('button', { name: 'ที่คั่นหน้า' });
    expect(bookmarkBtn.getAttribute('aria-pressed')).toBe('false');
    expect(within(bookmarkBtn).queryByText('1')).toBeNull();

    fireEvent.click(bookmarkBtn);
    expect(bookmarkBtn.getAttribute('aria-pressed')).toBe('true');
    // Badge + AA pin: white 10px-bold on red-600 ≥ 4.5:1 (red-500 was 3.79:1).
    const badge = within(bookmarkBtn).getByText('1');
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('bg-red-600');
    // The count is part of the accessible name (fix #22) — SR users hear it.
    expect(bookmarkBtn.getAttribute('aria-label')).toBe('ที่คั่นหน้า (1)');

    fireEvent.click(bookmarkBtn);
    expect(bookmarkBtn.getAttribute('aria-pressed')).toBe('false');
    expect(within(bookmarkBtn).queryByText('1')).toBeNull();
  });

  it('bookmark active state swaps the ribbon icon — never color-only (fix #9)', async () => {
    await renderReader();

    const bookmarkBtn = screen.getByRole('button', { name: 'ที่คั่นหน้า' });
    expect(bookmarkBtn.querySelector('.fi-sr-bookmark')).not.toBeNull();

    fireEvent.click(bookmarkBtn);
    // Active → check-circle (the same "confirmed" glyph as the copy flash);
    // aria-pressed stays for the toggle semantics.
    expect(bookmarkBtn.querySelector('.fi-sr-bookmark')).toBeNull();
    expect(bookmarkBtn.querySelector('.fi-sr-check-circle')).not.toBeNull();
    expect(bookmarkBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('theme picker: exactly 4 themes (night removed) with Thai ซีเปีย label (fix #19/20)', async () => {
    await renderReader();
    fireEvent.click(screen.getByRole('button', { name: /ธีม/ }));

    // Scope to the popover group — the trigger button's own name also
    // contains the current theme label.
    const picker = screen.getByRole('group', { name: 'ธีม' });
    for (const label of ['ธีมสว่าง', 'ธีมมืด', 'ธีมกระดาษ', 'ธีมซีเปีย']) {
      expect(within(picker).getByRole('button', { name: label })).toBeTruthy();
    }
    expect(within(picker).queryByRole('button', { name: 'ธีมกลางคืน' })).toBeNull();
    // Visible label is Thai — ซีเปีย, not the English 'sepia'.
    expect(within(picker).getByText('ซีเปีย')).toBeTruthy();
    // The paper slider still appears for the paper themes.
    fireEvent.click(within(picker).getByRole('button', { name: 'ธีมซีเปีย' }));
    expect(screen.getByRole('slider', { name: 'ความเหลืองของกระดาษ' })).toBeTruthy();
  });
});

describe('Dock v2.1 — close paths (Esc / ย่อ / X only — T12)', () => {
  it('Esc closes the panel and returns focus to the tools icon', async () => {
    await renderReader();
    expect(dockPanel()).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dockPanel()).toBeNull();
    // The focus restore is deferred until the collapsed icon remounts.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(dockIcon()).toBe(document.activeElement);
  });

  it('Esc from an open picker closes ONLY the picker and returns focus to its anchor', async () => {
    await renderReader();
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    fireEvent.click(themeBtn);
    expect(screen.getByRole('group', { name: 'ธีม' })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'ธีม' })).toBeNull();
    // Focus must NOT drop to <body> — the picker's trigger button gets it.
    expect(themeBtn).toBe(document.activeElement);
    // Esc cascades: the panel itself stays open.
    expect(dockPanel()).not.toBeNull();
  });

  it('panel X-close restores focus to the collapsed tools icon (Esc parity)', async () => {
    await renderReader();
    expect(dockPanel()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'ปิดแถบเครื่องมือ' }));
    expect(dockPanel()).toBeNull();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(dockIcon()).toBe(document.activeElement);
  });

  it('the ย่อ collapse button closes the panel (re-click collapses)', async () => {
    await renderReader();
    expect(dockPanel()).not.toBeNull();

    fireEvent.click(collapseBtn());
    expect(dockPanel()).toBeNull();
    expect(dockIcon()).toBeTruthy();

    // Re-click the icon expands again.
    fireEvent.click(dockIcon());
    expect(dockPanel()).not.toBeNull();
  });

  it('pointerdown OUTSIDE the dock does NOT close it (T12 — D1 reversed)', async () => {
    await renderReader();
    expect(dockPanel()).not.toBeNull();

    // A click inside the panel must not close it.
    fireEvent.pointerDown(screen.getByRole('button', { name: 'ค้นหามาตรา' }));
    expect(dockPanel()).not.toBeNull();

    // A click ANYWHERE outside must not close it either — the panel stays
    // until Esc / ย่อ / X (scrutiny fix: pickers keep their own close).
    fireEvent.pointerDown(document.body);
    expect(dockPanel()).not.toBeNull();
  });

  it('picker popovers STILL close on outside click (separate handlers — scrutiny fix)', async () => {
    await renderReader();
    fireEvent.click(screen.getByRole('button', { name: /ธีม/ }));
    expect(screen.getByRole('group', { name: 'ธีม' })).toBeTruthy();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('group', { name: 'ธีม' })).toBeNull();
    // The dock panel itself stays open (only the picker closed).
    expect(dockPanel()).not.toBeNull();
  });
});

describe('Dock v2.1 — Level 2 (เพิ่มเติม)', () => {
  it('เพิ่มเติม swaps to ALL tools with ย้อนกลับ back + per-tool pin toggles', async () => {
    await renderReader();
    const moreBtn = screen.getByRole('button', { name: 'เพิ่มเติม' });
    // Level-2 disclosure attrs (fix #1) — read BEFORE the click: the button
    // unmounts when Level 2 replaces Level 1.
    expect(moreBtn.getAttribute('aria-haspopup')).toBe('true');
    expect(moreBtn.getAttribute('aria-expanded')).toBe('false');
    expect(moreBtn.getAttribute('aria-controls')).toBe('lawlib-more-panel');
    fireEvent.click(moreBtn);
    expect(document.getElementById('lawlib-more-panel')).not.toBeNull();

    // All 11 tools listed (glossary/copy/copy-link/settings present).
    expect(screen.getByText('เครื่องมือทั้งหมด')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'บทนิยาม' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'คัดลอกมาตรานี้' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'คัดลอกลิงก์มาตรานี้' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^ตั้งค่า/ })).toBeTruthy();
    // 11 pin toggles (หนึ่งปุ่มต่อเครื่องมือ).
    expect(screen.getAllByRole('button', { name: /ปักหมุด|ถอด/ }).length).toBe(11);

    // Pin ธีม already pinned by default (curated row) — pin 'บทนิยาม' instead.
    const pinGlossary = screen.getByRole('button', { name: 'ปักหมุด บทนิยาม ไปแถวหลัก' });
    fireEvent.click(pinGlossary);
    expect(pinGlossary.getAttribute('aria-pressed')).toBe('true');

    // ย้อนกลับ → Level 1 now includes บทนิยาม.
    fireEvent.click(screen.getByRole('button', { name: /ย้อนกลับ/ }));
    expect(screen.getByRole('button', { name: 'บทนิยาม' })).toBeTruthy();
    expect(screen.queryByText('เครื่องมือทั้งหมด')).toBeNull();
  });

  it('Level-2 open moves focus to ย้อนกลับ — never drops to <body> (fix #1)', async () => {
    await renderReader();
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
    // The focus move is deferred until the back button mounts.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    const back = screen.getByRole('button', { name: /ย้อนกลับ/ });
    expect(back).toBe(document.activeElement);
  });

  it('Esc at Level 2 is 2-layer: first back to Level 1, second closes the dock (fix #16)', async () => {
    await renderReader();
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
    expect(screen.getByText('เครื่องมือทั้งหมด')).toBeTruthy();

    // First Esc → Level 1 (panel stays open), focus returns to เพิ่มเติม.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dockPanel()).not.toBeNull();
    expect(screen.queryByText('เครื่องมือทั้งหมด')).toBeNull();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(screen.getByRole('button', { name: 'เพิ่มเติม' })).toBe(document.activeElement);

    // Second Esc → the whole dock closes, focus returns to the tools icon.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dockPanel()).toBeNull();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(dockIcon()).toBe(document.activeElement);
  });

  it('ตั้งค่า row is LIVE: opens the settings picker (T10b — no longer disabled)', async () => {
    await renderReader();
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));

    const settingsRow = screen.getByRole('button', { name: /^ตั้งค่า/ });
    expect(settingsRow.hasAttribute('disabled')).toBe(false);
    fireEvent.click(settingsRow);
    // The settings picker opens as a labelled group (no nested dialog).
    expect(screen.getByRole('group', { name: 'ตั้งค่า' })).toBeTruthy();
  });

  it('T12c: position selector: 8 spots (3×3 minus center) now live in the ⚙️ settings panel, persisted', async () => {
    await renderReader();
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
    fireEvent.click(screen.getByRole('button', { name: /^ตั้งค่า/ }));
    const picker = screen.getByRole('group', { name: 'ตั้งค่า' });

    const group = within(picker).getByRole('group', { name: 'ตำแหน่งปุ่มเครื่องมือ' });
    const spots = within(group).getAllByRole('button');
    expect(spots.length).toBe(8);
    // Default = bottom-right.
    expect(
      within(group).getByRole('button', { name: 'ตำแหน่งล่างขวา' }).getAttribute('aria-pressed'),
    ).toBe('true');

    fireEvent.click(within(group).getByRole('button', { name: 'ตำแหน่งบนซ้าย' }));
    expect(
      within(group).getByRole('button', { name: 'ตำแหน่งบนซ้าย' }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(localStorage.getItem('lawlib:dockPosition')).toBe('top-left');
  });

  it('T12c: the position selector is GONE from Level 2 (settings-only now)', async () => {
    await renderReader();
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
    // The old Level-2 section (heading + 3×3 grid) no longer renders.
    expect(screen.queryByText('ตำแหน่งปุ่มเครื่องมือ')).toBeNull();
    expect(screen.queryByRole('group', { name: 'ตำแหน่งปุ่มเครื่องมือ' })).toBeNull();
  });

  it('mid-left position clamps the panel width to 100vw − icon footprint (375px no-overflow)', async () => {
    await renderReader();
    clickPositionInSettings('กลางซ้าย');

    // Side-anchored panels must not exceed the viewport: at 375px the shared
    // 92vw cap (345px) plus the icon offset would overflow. T10b: the icon
    // footprint rides --lawlib-dock-size (toolbar slider 24-56, default 44 →
    // 44px + 1rem = 3.75rem at the default).
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain(
      'w-[min(calc(100vw_-_var(--lawlib-dock-size)_-_1rem),26rem)]',
    );
  });

  it('mid-right clamps symmetrically (fix #27 — no LEFT-edge overflow at 375px)', async () => {
    await renderReader();
    clickPositionInSettings('กลางขวา');

    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain(
      'w-[min(calc(100vw_-_var(--lawlib-dock-size)_-_1rem),26rem)]',
    );
  });

  it('top-row positions clear the page H1: 14rem mobile / 11rem md (fix #17)', async () => {
    await renderReader();
    clickPositionInSettings('บนซ้าย');

    const root = document.querySelector('.lawlib-dock.fixed') as HTMLElement;
    expect(root.className).toContain('top-[max(14rem,env(safe-area-inset-top))]');
    expect(root.className).toContain('md:top-[max(11rem,env(safe-area-inset-top))]');
    // The panel cap follows the raised anchor + the toolbar-size var
    // (T10b) so it stays fully in-viewport at every size 24-56.
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain('max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_15rem)]');
    expect(panel.className).toContain('md:max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_12rem)]');
  });

  it('bookmarks list in Level 2: grouped chapter rows with jump + delete', async () => {
    await renderReader();

    // Bookmark the current article (mount defaulted activeKey to the first).
    fireEvent.click(screen.getByRole('button', { name: 'ที่คั่นหน้า' }));

    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
    expect(screen.getByText(/ที่คั่นหน้า \(1\)/)).toBeTruthy();

    const panel = dockPanel() as HTMLElement;
    // TOC sidebar also renders มาตรา N buttons — scope to the dock panel.
    expect(within(panel).getByRole('button', { name: /^มาตรา \d/ })).toBeTruthy();
    fireEvent.click(within(panel).getByRole('button', { name: /ลบที่คั่นหน้า/ }));
    expect(screen.getByText(/ที่คั่นหน้า \(0\)/)).toBeTruthy();
  });
});

describe('Dock v2.1 — direction-aware layout (T12)', () => {
  it('side position (default bottom-right): Level-1 VERTICAL column + Level-2 2-col grid', async () => {
    await renderReader();
    const panel = dockPanel() as HTMLElement;

    // Level 1 favorites flow top-to-bottom (the row wrapping the pickers).
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    const favoritesRow = themeBtn.closest('[class*="flex-col"]') as HTMLElement;
    expect(favoritesRow).not.toBeNull();
    expect(favoritesRow.className).toContain('flex-col');
    expect(favoritesRow.className).not.toContain('flex-wrap');

    // Level 2 tools = 2-col grid (vertical panel), no horizontal 3-col step.
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
    const ul = panel.querySelector('#lawlib-more-panel ul') as HTMLElement;
    expect(ul.className).toContain('grid grid-cols-2');
    expect(ul.className).not.toContain('sm:grid-cols-3');
  });

  it('middle position (top-center): Level-1 HORIZONTAL row + Level-2 horizontal grid', async () => {
    await renderReader();
    // Switch the position FIRST (the default bottom-right is a side position
    // → vertical; L1 only re-renders horizontally once the position lands).
    // T12c: the position grid lives in the ⚙️ settings picker.
    clickPositionInSettings('บนกลาง');
    // Esc closes the picker only — Level 2 stays; then ย้อนกลับ → Level 1.
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: /ย้อนกลับ/ }));

    // Capture the Level-1 row BEFORE opening Level 2 again (L1 unmounts
    // while เพิ่มเติม is shown; the L2 rows also share the ธีม label).
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    const favoritesRow = themeBtn.closest('[class*="flex-wrap"]') as HTMLElement;
    expect(favoritesRow).not.toBeNull();
    expect(favoritesRow.className).toContain('flex-wrap');

    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));

    const panel = dockPanel() as HTMLElement;
    // Level 2 tools = horizontal grid (3 cols from sm up).
    const ul = panel.querySelector('#lawlib-more-panel ul') as HTMLElement;
    expect(ul.className).toContain('grid grid-cols-2');
    expect(ul.className).toContain('sm:grid-cols-3');
  });

  it('side positions animate the slide SIDEWAYS with --lawlib-dock-slide', async () => {
    await renderReader();
    clickPositionInSettings('กลางซ้าย');

    const root = document.querySelector('.lawlib-dock.fixed') as HTMLElement;
    expect(root.style.getPropertyValue('--lawlib-dock-slide')).toBe('-8px');
  });
});

describe('Dock v2.1 — mobile bottom sheet (T12)', () => {
  it('mobile (≤639px): full-width bottom sheet, open per default, horizontal Level 1', async () => {
    mockMatchMedia({ mobile: true });
    await renderReader();

    // The sheet is open on load (user: เปิดทั้ง 2 — mobile too).
    const panel = dockPanel() as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.className).toContain('fixed inset-x-0 bottom-0');
    expect(panel.className).toContain('rounded-t-2xl');
    expect(panel.className).not.toContain('bottom-full');
    expect(panel.className).toContain('max-h-[min(65vh,34rem)]');

    // The sheet's Level 1 flows horizontally (wrap).
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    const favoritesRow = themeBtn.closest('[class*="flex-wrap"]') as HTMLElement;
    expect(favoritesRow).not.toBeNull();
  });

  it('mobile respects the collapse memory too (user collapsed → sheet closed next visit)', async () => {
    mockMatchMedia({ mobile: true });
    localStorage.setItem('lawlib:dockCollapsed', 'true');
    await renderReader();

    expect(dockPanel()).toBeNull();
    fireEvent.click(dockIcon());
    expect(dockPanel()).not.toBeNull();
    expect(localStorage.getItem('lawlib:dockCollapsed')).toBe('false');
  });
});

describe('Dock v2.1 — non-default value dots (T12)', () => {
  it('no dots at defaults; a dot appears on the picker whose value changed', async () => {
    await renderReader();

    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    const fontSizeBtn = screen.getByRole('button', { name: /ตัวอักษร/ });
    const lineHeightBtn = screen.getByRole('button', { name: /บรรทัด/ });
    const widthBtn = screen.getByRole('button', { name: /กว้าง/ });
    expect(themeBtn.querySelector('.bg-blue-500')).toBeNull();
    expect(fontSizeBtn.querySelector('.bg-blue-500')).toBeNull();
    expect(lineHeightBtn.querySelector('.bg-blue-500')).toBeNull();
    expect(widthBtn.querySelector('.bg-blue-500')).toBeNull();

    // Change the font size → ONLY that button gets the dot.
    fireEvent.click(fontSizeBtn);
    fireEvent.click(screen.getByRole('button', { name: 'ขนาดตัวอักษร 18px' }));
    expect(fontSizeBtn.querySelector('.bg-blue-500')).not.toBeNull();
    expect(themeBtn.querySelector('.bg-blue-500')).toBeNull();
    expect(lineHeightBtn.querySelector('.bg-blue-500')).toBeNull();
    expect(widthBtn.querySelector('.bg-blue-500')).toBeNull();
  });

  it('theme picker dots: non-default theme shows a dot; returning to สว่าง clears it', async () => {
    await renderReader();
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });

    fireEvent.click(themeBtn);
    // The picker STAYS open after a selection (no auto-collapse) — the next
    // option is one click away without re-toggling the trigger.
    fireEvent.click(screen.getByRole('button', { name: 'ธีมมืด' }));
    expect(themeBtn.querySelector('.bg-blue-500')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'ธีมสว่าง' }));
    expect(themeBtn.querySelector('.bg-blue-500')).toBeNull();
  });

  it('T12c: OS-dark first visit (no stored theme) shows NO theme dot — the baseline is the RESOLVED initial theme', async () => {
    mockMatchMedia({ dark: true });
    await renderReader();
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    // The theme resolved to dark (OS fallback — nothing stored).
    expect(themeBtn.textContent).toContain('มืด');
    // NO false dot: dark IS this user's resolved initial theme.
    expect(themeBtn.querySelector('.bg-blue-500')).toBeNull();

    // A REAL change from the baseline (light) shows the dot.
    fireEvent.click(themeBtn);
    fireEvent.click(screen.getByRole('button', { name: 'ธีมสว่าง' }));
    expect(themeBtn.querySelector('.bg-blue-500')).not.toBeNull();
  });
});

describe('Dock v2.1 — animation (T12, gated by animateDock + reduced-motion)', () => {
  it('animateDock ON + no reduced motion: collapse plays the exit animation (150ms hold)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(collapseBtn());
    // The panel stays mounted while the exit animation runs…
    const panel = dockPanel() as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.className).toContain('lawlib-dock-anim-out-up');
    // …and the collapse memory is already persisted.
    expect(localStorage.getItem('lawlib:dockCollapsed')).toBe('true');

    // After the 150ms window the panel unmounts and the icon takes over.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    expect(dockPanel()).toBeNull();
    expect(dockIcon()).toBeTruthy();
  });

  it('settings.animateDock=false → instant collapse even without reduced motion', async () => {
    mockMatchMedia({ reducedMotion: false });
    localStorage.setItem('lawlib:settings', JSON.stringify({ fontSize: 16, animateDock: false }));
    await renderReader();

    fireEvent.click(collapseBtn());
    expect(dockPanel()).toBeNull();
  });

  it('prefers-reduced-motion → instant collapse (no closing hold)', async () => {
    // Test default: reducedMotion stub ON.
    await renderReader();
    fireEvent.click(collapseBtn());
    expect(dockPanel()).toBeNull();
  });
});

describe('Dock v2.1 — mobile-safe panel structure', () => {
  it('panel carries max-h + overflow-y-auto (375px no-overflow contract)', async () => {
    await renderReader();
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain('overflow-y-auto');
    expect(panel.className).toContain('max-h-');
  });
});
