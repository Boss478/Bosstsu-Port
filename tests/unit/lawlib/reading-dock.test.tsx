// @vitest-environment jsdom
/**
 * LawlibDock v2.3 COMPACT (T10a + T12 + T14 + T15 — ADR-019
 * D1/D2/D3/D6/D9/D10/D11) contract tests.
 *
 * The dock is exercised THROUGH the full reader client:
 * `<ThemeProvider><LawlibReaderClient law={sampleLaw} /></ThemeProvider>`
 * (module-local wiring precedent — the dock is a real component importing the
 * reader's storage/theme state).
 *
 * Pinned here:
 * - Level 1 OPEN BY DEFAULT (T12 D9 — reversed D1 default-collapsed):
 *   panel renders on mount, ⋯/× visible at the END of Level 1, focus NOT
 *   stolen; `lawlib:dockCollapsed` memory: user collapse → next visit starts
 *   collapsed; expand clears it
 * - T15 v2.3 GLASS CONTRACT: the L1 panel KEEPS the glass panel wrapper
 *   (`lawlib-glass lawlib-glass-xs lawlib-glass-sheen` — border + bg + blur)
 *   at a COMPACT 64px width (w-16, side positions); L2 is a SEPARATE 112px
 *   sibling glass panel (w-28) with the SAME uniform glass (no more
 *   lawlib-glass-strong distinction); the panel HEADER is GONE
 * - T14 picker buttons: ICON + current value label UNDER the icon
 *   (16px / 1.8 / 100%); ธีม = icon ONLY — the glyph mirrors the theme
 *   (☀️/🌙/📖/🎨) and the accessible name carries the current value
 * - panel STAYS OPEN after actions (picker open, option picked) — no
 *   auto-collapse (D1)
 * - close paths: Esc (focus returns to the icon) · × button (bottom of L1) —
 *   pointerdown-outside NO LONGER closes the dock panel (T12); the picker
 *   POPOVER still closes on outside click (scrutiny fix — separate handlers)
 * - pickers: click-to-expand popover (aria-expanded), DIRECT choice (no
 *   cycling), Esc closes the popover only
 * - T12 direction-aware layout: side positions (default bottom-right) =
 *   vertical Level-1 column; middle positions (top/bottom-center) =
 *   horizontal row; mobile (≤639px) = full-width bottom sheet (open per
 *   default, Level 2 COLLAPSED)
 * - T15 Level 2 = SIBLING glass panel (NOT a swap inside L1): icon-only
 *   2-col grid — row 1 = the Level-1 favorites, row 2 = the rest (glossary ·
 *   bookmarks-ALL · copy · copy-link · ⚙️ settings); NO ย้อนกลับ back button;
 *   dots ⋯ TOGGLES it open/closed (aria-label เพิ่มเติม kept — e2e parity)
 * - T14 bookmarks-ALL opens the bookmarks PANEL (drawer like search/notes —
 *   converted from the old L2 section; the L1 bookmark stays the toggle)
 * - T12 non-default value dots: picker button shows a blue dot when its
 *   value ≠ default; no dot at defaults
 * - T12 animation: expand/collapse slide+fade ~150ms, gated by
 *   settings.animateDock AND prefers-reduced-motion (tests default the
 *   reduced-motion stub ON → instant swaps, so close-path assertions stay
 *   synchronous; dedicated tests flip it OFF)
 * - T25 animation (ADR-023 D9 locked values): L2 menu pops in 200ms
 *   (lawlib-pop-in, origin per the `more` flip) and exits with a 140ms
 *   pop-out + L2_ANIM_MS delay-unmount (re-open cancels a pending exit);
 *   L1 expand morphs 200ms from the dock icon (lawlib-morph-in replaces
 *   the old dock-in; USER-INITIATED expand only — the default-open page
 *   load renders WITHOUT the morph, T25-fix user decision; collapse keeps
 *   the 150ms dock-out); `vt-dock` sits on the ROOT wrapper only
 * - bookmark: toggle + aria-pressed + count badge
 * - T12c theme dot: baselines on the RESOLVED initial theme (OS-dark
 *   fallback users see no false dot on first visit)
 * - mobile-safe panel: max-h + overflow-y-auto (T20 — desktop: NONE, the
 *   panel grows with its content; mobile: on the sheet only)
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
import { DEFAULT_READING_SETTINGS, DOCK_TOOL_KEYS } from '@/hooks/useReaderStorage';
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
/** T15 v2.3: the × close button at the END of Level 1 (replaces the removed
 *  panel header — collapses the dock to the icon, persists the memory). */
const closeDockBtn = () => screen.getByRole('button', { name: 'ปิดแถบเครื่องมือ' });
/** T15 v2.3: the ⋯ dots toggle (Level-2 disclosure). */
const moreBtn = () => screen.getByRole('button', { name: 'เพิ่มเติม' });
const morePanel = () => document.getElementById('lawlib-more-panel');
/** T15 v2.3: the Level-1 direction container (flex-col on side positions,
 *  flex-wrap on middle/mobile). */
const l1Container = () => document.querySelector('[data-lawlib-l1]') as HTMLElement | null;
/** T15 v2.3: the Level-1 TOOLS wrapper (desktop side positions — T20: no
 *  max-h / overflow anymore, the panel grows with its content). */
const l1Tools = () => document.querySelector('[data-lawlib-l1-tools]') as HTMLElement | null;

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

describe('Dock v2.3 — Level 1 OPEN BY DEFAULT + GLASS PANEL KEPT (T12/T15)', () => {
  it('renders the compact glass panel on mount: ⋯/× at the end of Level 1, L2 closed', async () => {
    await renderReader();

    const panel = dockPanel();
    expect(panel).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'เครื่องมืออ่าน' })).toBeNull();
    // T15 v2.3 GLASS CONTRACT (the #1 requirement — the v1 regression
    // removed the wrapper and the user REJECTED it): the L1 panel KEEPS
    // the glass panel wrapper (border + bg + blur) at a COMPACT 64px width.
    expect(panel!.className).toContain('lawlib-glass lawlib-glass-xs lawlib-glass-sheen');
    expect(panel!.className).toContain('w-16');
    // The panel HEADER is GONE (no ย่อ/ปิด header row) — the × close moved
    // to the END of Level 1, next to the ⋯ dots toggle.
    expect(screen.queryByRole('button', { name: 'ย่อแถบเครื่องมือ' })).toBeNull();
    const closeBtn = closeDockBtn();
    expect(closeBtn.className).toContain('h-7 w-7');
    const dots = moreBtn();
    expect(dots.getAttribute('aria-expanded')).toBe('false');
    expect(closeBtn.parentElement).toBe(dots.parentElement);
    // Level 2 is COLLAPSED by default on desktop too.
    expect(morePanel()).toBeNull();

    // The default curated row shows CURRENT values: pickers = icon + value
    // label UNDER the icon (T14); ธีม = icon ONLY (its glyph mirrors the
    // state — light → ☀️ fi-sr-sun), the value rides the accessible name.
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    expect(themeBtn.querySelector('.fi-sr-sun')).not.toBeNull();
    expect(themeBtn.getAttribute('aria-label')).toBe('ธีม สว่าง');
    expect(screen.getByRole('button', { name: /ตัวอักษร/ }).textContent).toContain('16px');
    expect(screen.getByRole('button', { name: /บรรทัด/ }).textContent).toContain('1.8');
    expect(screen.getByRole('button', { name: /กว้าง/ }).textContent).toContain('100%');
    expect(screen.getByRole('button', { name: 'ที่คั่นหน้า' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ค้นหามาตรา' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'บันทึกของฉัน' })).toBeTruthy();
  });

  it('does NOT steal focus on the default-open mount', async () => {
    await renderReader();
    // The panel is open on load — focusing its first control would yank the
    // user's cursor away from the page content.
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'ค้นหามาตรา' }));
    expect(document.activeElement).not.toBe(closeDockBtn());
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

  it('user expand clears the collapse memory; user collapse (×) persists it', async () => {
    localStorage.setItem('lawlib:dockCollapsed', 'true');
    await renderReader();
    expect(dockPanel()).toBeNull();

    // Expand → memory cleared (next visit opens).
    fireEvent.click(dockIcon());
    expect(dockPanel()).not.toBeNull();
    expect(localStorage.getItem('lawlib:dockCollapsed')).toBe('false');

    // Collapse (× at the bottom of L1) → memory set (next visit starts
    // collapsed).
    fireEvent.click(closeDockBtn());
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
    // The picker button now shows the NEW current value: the theme glyph
    // swaps ☀️→🌙 (icon-only) and the accessible name carries the value.
    expect(themeBtn.querySelector('.fi-sr-moon')).not.toBeNull();
    expect(themeBtn.querySelector('.fi-sr-sun')).toBeNull();
    expect(themeBtn.getAttribute('aria-label')).toBe('ธีม มืด');
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

describe('Dock v2.3 — close paths (Esc / × only — T12/T15)', () => {
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

  it('the × close button at the END of Level 1 collapses the dock (re-click expands)', async () => {
    await renderReader();
    expect(dockPanel()).not.toBeNull();

    fireEvent.click(closeDockBtn());
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

describe('Dock v2.3 — Level 2 (⋯ dots — T15 sibling glass panel)', () => {
  it('dots ⋯ opens the SIBLING glass panel: favorites + divider + rest; NO back button / pins/text', async () => {
    await renderReader();
    const dots = moreBtn();
    // Level-2 disclosure attrs (fix #1) — read BEFORE the click.
    expect(dots.getAttribute('aria-haspopup')).toBe('true');
    expect(dots.getAttribute('aria-expanded')).toBe('false');
    expect(dots.getAttribute('aria-controls')).toBe('lawlib-more-panel');
    fireEvent.click(dots);
    expect(dots.getAttribute('aria-expanded')).toBe('true');

    const panel = morePanel();
    expect(panel).not.toBeNull();
    // T15 v2.3: L2 = a SEPARATE 112px glass panel with the SAME uniform
    // glass as L1 — a SIBLING of the Level-1 content (NOT inside it, NOT a
    // swap: Level 1 stays mounted).
    expect(panel!.className).toContain('lawlib-glass lawlib-glass-xs lawlib-glass-sheen');
    expect(panel!.className).toContain('w-28');
    expect(l1Container()!.contains(panel as HTMLElement)).toBe(false);
    expect(screen.getByRole('button', { name: 'เพิ่มเติม' })).toBeTruthy();

    // Row 1 = the Level-1 favorite set (default curated row), row 2 = the
    // rest (glossary · bookmarks-ALL · copy · copy-link · ⚙️ settings) —
    // ALL icons with accessible names (labels ride aria-label).
    expect(within(panel as HTMLElement).getByRole('button', { name: /ธีม/ })).toBeTruthy();
    expect(within(panel as HTMLElement).getByRole('button', { name: /ตัวอักษร/ })).toBeTruthy();
    expect(within(panel as HTMLElement).getByRole('button', { name: /กว้าง/ })).toBeTruthy();
    expect(within(panel as HTMLElement).getByRole('button', { name: 'ที่คั่นหน้า' })).toBeTruthy();
    expect(within(panel as HTMLElement).getByRole('button', { name: 'บทนิยาม' })).toBeTruthy();
    expect(
      within(panel as HTMLElement).getByRole('button', { name: 'ที่คั่นหน้าทั้งหมด' }),
    ).toBeTruthy();
    expect(
      within(panel as HTMLElement).getByRole('button', { name: 'คัดลอกมาตรานี้' }),
    ).toBeTruthy();
    expect(
      within(panel as HTMLElement).getByRole('button', { name: 'คัดลอกลิงก์มาตรานี้' }),
    ).toBeTruthy();
    expect(within(panel as HTMLElement).getByRole('button', { name: /^ตั้งค่า/ })).toBeTruthy();

    // T15 v2.3: NO back button (the ⋯ dots toggle replaces ย้อนกลับ) — and
    // NO section titles / text rows / pin toggles (T14 — pins moved to ⚙️).
    expect(within(panel as HTMLElement).queryByRole('button', { name: 'ย้อนกลับ' })).toBeNull();
    expect(screen.queryByText('เครื่องมือทั้งหมด')).toBeNull();
    expect(screen.queryByText(/ที่คั่นหน้า \(\d+\)/)).toBeNull();
    expect(screen.queryByRole('button', { name: /ปักหมุด|ถอด/ })).toBeNull();
  });

  it('dots ⋯ TOGGLES: second click closes L2 (Level 1 never unmounts)', async () => {
    await renderReader();
    const dots = moreBtn();
    fireEvent.click(dots);
    expect(morePanel()).not.toBeNull();
    expect(dots.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(dots);
    expect(morePanel()).toBeNull();
    expect(dots.getAttribute('aria-expanded')).toBe('false');
    // The toggle never swapped Level 1 out — the tools are still there.
    expect(screen.getByRole('button', { name: /ธีม/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ค้นหามาตรา' })).toBeTruthy();
  });

  it('Level-2 open moves focus to its FIRST icon — never drops to <body> (fix #1)', async () => {
    await renderReader();
    fireEvent.click(moreBtn());
    // The focus move is deferred until the L2 panel mounts.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    const panel = morePanel() as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it('Esc at Level 2 is 2-layer: first closes L2 (focus → ⋯), second closes the dock (fix #16)', async () => {
    await renderReader();
    fireEvent.click(moreBtn());
    expect(morePanel()).not.toBeNull();

    // First Esc → Level 2 closes (Level 1 stays open), focus returns to ⋯.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dockPanel()).not.toBeNull();
    expect(morePanel()).toBeNull();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(moreBtn()).toBe(document.activeElement);

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
    fireEvent.click(moreBtn());

    const settingsRow = screen.getByRole('button', { name: /^ตั้งค่า/ });
    expect(settingsRow.hasAttribute('disabled')).toBe(false);
    fireEvent.click(settingsRow);
    // The settings picker opens as a labelled group (no nested dialog).
    expect(screen.getByRole('group', { name: 'ตั้งค่า' })).toBeTruthy();
  });

  it('T12c: position selector: 8 spots (3×3 minus center) now live in the ⚙️ settings panel, persisted', async () => {
    await renderReader();
    fireEvent.click(moreBtn());
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
    fireEvent.click(moreBtn());
    // The old Level-2 section (heading + 3×3 grid) no longer renders.
    expect(screen.queryByText('ตำแหน่งปุ่มเครื่องมือ')).toBeNull();
    expect(screen.queryByRole('group', { name: 'ตำแหน่งปุ่มเครื่องมือ' })).toBeNull();
  });

  it('L1 panel is a FIXED 64px column (w-16) at the default bottom-right — the 26rem clamp is gone', async () => {
    await renderReader();
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain('w-16');
    expect(panel.className).not.toContain('w-[min(');
    expect(panel.className).not.toContain('26rem');
  });

  it('mid-left keeps the fixed 64px column (old clamp position — 375px safe by design now)', async () => {
    await renderReader();
    clickPositionInSettings('กลางซ้าย');
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain('w-16');
    expect(panel.className).not.toContain('w-[min(');
  });

  it('mid-right keeps the fixed 64px column too (no symmetric clamp needed, fix #27)', async () => {
    await renderReader();
    clickPositionInSettings('กลางขวา');
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain('w-16');
    expect(panel.className).not.toContain('w-[min(');
  });

  it('top-row positions clear the page H1: 14rem mobile / 11rem md (fix #17)', async () => {
    await renderReader();
    clickPositionInSettings('บนซ้าย');

    const root = document.querySelector('.lawlib-dock.fixed') as HTMLElement;
    expect(root.className).toContain('top-[max(14rem,env(safe-area-inset-top))]');
    expect(root.className).toContain('md:top-[max(11rem,env(safe-area-inset-top))]');
    // T20 (user decision 2026-08-09): the tools column NEVER scrolls — the
    // viewport caps are gone, the panel grows with its content.
    const tools = l1Tools() as HTMLElement;
    expect(tools.className).not.toContain('max-h-');
    expect(tools.className).not.toContain('overflow-y-auto');
  });

  it('T14: bookmarks-ALL icon opens the bookmarks PANEL (drawer, like search/notes) with jump + delete', async () => {
    await renderReader();

    // Bookmark the current article (mount defaulted activeKey to the first).
    fireEvent.click(screen.getByRole('button', { name: 'ที่คั่นหน้า' }));

    fireEvent.click(moreBtn());
    fireEvent.click(screen.getByRole('button', { name: 'ที่คั่นหน้าทั้งหมด' }));

    // The bookmarks LIST is now a modal panel — the old L2 section is gone.
    const dialog = screen.getByRole('dialog', { name: 'ที่คั่นหน้าทั้งหมด' });
    expect(dialog).toBeTruthy();
    // TOC sidebar also renders มาตรา N buttons — scope to the dialog.
    expect(within(dialog).getByRole('button', { name: /^มาตรา \d/ })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: /ลบที่คั่นหน้า/ }));
    expect(within(dialog).getByText(/ยังไม่มีที่คั่นหน้า/)).toBeTruthy();

    // Esc closes the panel (drawer); the dock stays open.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'ที่คั่นหน้าทั้งหมด' })).toBeNull();
    expect(dockPanel()).not.toBeNull();
  });
});

describe('Dock v2.3 — direction-aware layout (T12/T15)', () => {
  it('side position (default bottom-right): Level-1 VERTICAL column + Level-2 2-col grid', async () => {
    await renderReader();
    const panel = dockPanel() as HTMLElement;

    // Level 1 favorites flow top-to-bottom (the wrapper around the pickers).
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    const favoritesRow = themeBtn.closest('[class*="flex-col"]') as HTMLElement;
    expect(favoritesRow).not.toBeNull();
    expect(favoritesRow.className).toContain('flex-col');
    expect(favoritesRow.className).not.toContain('flex-wrap');

    // Level 2 tools = uniform 2-col grid (32px icons, gap-0.5) — no
    // horizontal 3-col step in any layout (T15 v2.3).
    fireEvent.click(moreBtn());
    const ul = panel.querySelector('#lawlib-more-panel ul') as HTMLElement;
    expect(ul.className).toContain('grid grid-cols-2');
    expect(ul.className).toContain('gap-0.5');
    expect(ul.className).not.toContain('sm:grid-cols-3');
  });

  it('middle position (top-center): Level-1 HORIZONTAL row + Level-2 2-col grid', async () => {
    await renderReader();
    // Switch the position FIRST (the default bottom-right is a side position
    // → vertical; L1 only re-renders horizontally once the position lands).
    // T12c: the position grid lives in the ⚙️ settings picker.
    clickPositionInSettings('บนกลาง');
    // Esc closes the picker only — L2 stays open; ⋯ toggles it back closed
    // (the old ย้อนกลับ detour is gone with the back button).
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(moreBtn());

    // The Level-1 row flows horizontally (wrap).
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    const favoritesRow = themeBtn.closest('[class*="flex-wrap"]') as HTMLElement;
    expect(favoritesRow).not.toBeNull();
    expect(favoritesRow.className).toContain('flex-wrap');

    fireEvent.click(moreBtn());

    const panel = dockPanel() as HTMLElement;
    // Level 2 tools = the same uniform 2-col grid (no 3-col step anywhere).
    const ul = panel.querySelector('#lawlib-more-panel ul') as HTMLElement;
    expect(ul.className).toContain('grid grid-cols-2');
    expect(ul.className).not.toContain('sm:grid-cols-3');
  });

  it('side positions animate the slide SIDEWAYS with --lawlib-dock-slide', async () => {
    await renderReader();
    clickPositionInSettings('กลางซ้าย');

    const root = document.querySelector('.lawlib-dock.fixed') as HTMLElement;
    expect(root.style.getPropertyValue('--lawlib-dock-slide')).toBe('-8px');
  });
});

describe('Dock v2.3 — mobile bottom sheet (T12/T15)', () => {
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

    // T15 v2.3: Level 2 is COLLAPSED in the sheet by default — ⋯ expands it
    // as an in-flow block (full-width, own glass surface).
    expect(morePanel()).toBeNull();
    fireEvent.click(moreBtn());
    const l2 = morePanel() as HTMLElement;
    expect(l2).not.toBeNull();
    expect(l2.className).toContain('lawlib-glass lawlib-glass-xs lawlib-glass-sheen');
    expect(l2.className).toContain('w-full');
    expect(l2.className).not.toContain('absolute');
    // Level 1 stays in the sheet beside/above it — BOTH ธีม buttons exist
    // (the L1 picker with its value label + the L2 grid icon).
    expect(screen.getAllByRole('button', { name: /ธีม/ })).toHaveLength(2);
    // ⋯ toggles it closed again.
    fireEvent.click(moreBtn());
    expect(morePanel()).toBeNull();
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

  it('T27c: the theme-glyph swap animation fires ONLY on a real theme change — never on mount or remount', async () => {
    await renderReader();
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    const themeIcon = () => themeBtn.querySelector('i')!;

    // Page-load mount (default สว่าง): the swap class is SUPPRESSED — the
    // swap state initializes to the mount-time theme, so a fresh mount must
    // not replay the animation.
    expect(themeIcon().className).toContain('fi-sr-sun');
    expect(themeIcon().className).not.toContain('lawlib-icon-swap');

    // A REAL theme change remounts the keyed glyph WITH the swap class
    // (300ms rotate-fade + spring pop — T27c AC-4).
    fireEvent.click(themeBtn);
    fireEvent.click(screen.getByRole('button', { name: 'ธีมมืด' }));
    expect(themeIcon().className).toContain('fi-sr-moon');
    expect(themeIcon().className).toContain('lawlib-icon-swap');

    // The deferred sync lands PAST the 300ms animation (timer = ICON_SWAP_MS
    // + 50ms) — the swap class drops (the 100% keyframe equals the natural
    // state, so this is invisible) and the state now matches the theme.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(themeIcon().className).not.toContain('lawlib-icon-swap');

    // Esc closes the picker (dock stays open) → user collapse → expand: the
    // panel AND the glyph remount fresh on the SAME theme — the swap must
    // NOT replay on the remount (the state synced after the change).
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(closeDockBtn());
    fireEvent.click(dockIcon());
    const remounted = screen.getByRole('button', { name: /ธีม/ }).querySelector('i')!;
    expect(remounted.className).toContain('fi-sr-moon');
    expect(remounted.className).not.toContain('lawlib-icon-swap');
  });

  it('T12c: OS-dark first visit (no stored theme) shows NO theme dot — the baseline is the RESOLVED initial theme', async () => {
    mockMatchMedia({ dark: true });
    await renderReader();
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    // The theme resolved to dark (OS fallback — nothing stored): the glyph
    // shows 🌙 and the accessible name carries the resolved value.
    expect(themeBtn.querySelector('.fi-sr-moon')).not.toBeNull();
    expect(themeBtn.getAttribute('aria-label')).toBe('ธีม มืด');
    // NO false dot: dark IS this user's resolved initial theme.
    expect(themeBtn.querySelector('.bg-blue-500')).toBeNull();

    // A REAL change from the baseline (light) shows the dot.
    fireEvent.click(themeBtn);
    fireEvent.click(screen.getByRole('button', { name: 'ธีมสว่าง' }));
    expect(themeBtn.querySelector('.bg-blue-500')).not.toBeNull();
  });
});

describe('Dock v2.3 — animation (T12, gated by animateDock + reduced-motion)', () => {
  it('animateDock ON + no reduced motion: collapse plays the exit animation (150ms hold)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(closeDockBtn());
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

    fireEvent.click(closeDockBtn());
    expect(dockPanel()).toBeNull();
  });

  it('prefers-reduced-motion → instant collapse (no closing hold)', async () => {
    // Test default: reducedMotion stub ON.
    await renderReader();
    fireEvent.click(closeDockBtn());
    expect(dockPanel()).toBeNull();
  });
});

describe('Dock v2.6 — T25 L2 menu pop + L1 morph (ADR-023 D9 locked values)', () => {
  it('L2 open with the gate on: lawlib-pop-in + transform-origin at the ⋯ side (bottom-right → right bottom)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    fireEvent.click(moreBtn());
    const panel = morePanel() as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.className).toContain('lawlib-pop-in');
    expect(panel.className).not.toContain('lawlib-pop-out');
    // The menu grows FROM the ⋯ trigger — default bottom-right dock = L2 on
    // the LEFT of L1 (right-full), origin at its right-bottom corner.
    expect(panel.style.transformOrigin).toBe('right bottom');
  });

  it('L2 close with the gate on: pop-out hold keeps the panel mounted (140ms exit inside L2_ANIM_MS), then unmounts', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    fireEvent.click(moreBtn());
    fireEvent.click(moreBtn());
    const panel = morePanel() as HTMLElement;
    expect(panel).not.toBeNull(); // held for the exit animation
    expect(panel.className).toContain('lawlib-pop-out');
    expect(moreBtn().getAttribute('aria-expanded')).toBe('false');
    // The exit (140ms) + hold (L2_ANIM_MS = 200ms) complete → unmount.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    expect(morePanel()).toBeNull();
  });

  it('L2 re-open during the exit hold cancels it — the menu stays alive', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    fireEvent.click(moreBtn()); // open
    fireEvent.click(moreBtn()); // close → exit hold starts
    expect(morePanel()!.className).toContain('lawlib-pop-out');
    fireEvent.click(moreBtn()); // re-open within the hold
    const panel = morePanel() as HTMLElement;
    expect(panel.className).toContain('lawlib-pop-in');
    expect(moreBtn().getAttribute('aria-expanded')).toBe('true');
    // The original exit timer must not fire a late unmount.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    expect(morePanel()).not.toBeNull();
  });

  it('L2 rapid triple-toggle: a STALE exit timer must not cut the second exit short (ADR-023 D4)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    fireEvent.click(moreBtn()); // open
    fireEvent.click(moreBtn()); // close #1 → exit timer A (+200ms)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    fireEvent.click(moreBtn()); // re-open (cancels timer A)
    fireEvent.click(moreBtn()); // close #2 → exit timer B (+200ms)
    // +220ms after close #1: timer A has already fired — WITHOUT the
    // cancellation the menu would be unmounted mid-exit #2 (timer B still
    // holds until +300ms).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
    });
    expect(morePanel()).not.toBeNull();
    // Timer B fires → unmount.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    expect(morePanel()).toBeNull();
  });

  it('L2 with the gate OFF (animateDock=false): instant mount/unmount, no pop classes', async () => {
    mockMatchMedia({ reducedMotion: false });
    localStorage.setItem('lawlib:settings', JSON.stringify({ fontSize: 16, animateDock: false }));
    await renderReader();
    fireEvent.click(moreBtn());
    const panel = morePanel() as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.className).not.toContain('lawlib-pop-in');
    fireEvent.click(moreBtn());
    expect(morePanel()).toBeNull(); // instant — no closing hold
  });

  it('L2 Esc close with the gate on: pop-out hold + focus → ⋯, then unmounts (Esc parity with the toggle)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    fireEvent.click(moreBtn());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(morePanel()).not.toBeNull();
    expect(morePanel()!.className).toContain('lawlib-pop-out');
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(moreBtn()).toBe(document.activeElement);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    expect(morePanel()).toBeNull();
  });

  it('L1 default-open page load: NO lawlib-morph-in — the morph is user-initiated expand only (T25-fix user decision)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    const panel = dockPanel() as HTMLElement;
    // Page load with the panel open by default: no load animation (the
    // morph would read as a re-mount glitch on every article visit).
    expect(panel.className).not.toContain('lawlib-morph-in');
    // Regression pin: the 200ms morph SUPERSEDES the directional dock-in.
    expect(panel.className).not.toContain('lawlib-dock-anim-in');
    expect(panel.style.transformOrigin).toBe('bottom right');
  });

  it('L1 collapse keeps the directional dock-out; re-expand morphs in again', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    fireEvent.click(closeDockBtn());
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain('lawlib-dock-anim-out-up'); // DOCK_ANIM_MS path untouched
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    expect(dockPanel()).toBeNull();
    fireEvent.click(dockIcon());
    const rePanel = dockPanel() as HTMLElement;
    expect(rePanel.className).toContain('lawlib-morph-in');
    expect(rePanel.style.transformOrigin).toBe('bottom right');
  });

  it('morph gate OFF (reduced-motion stub ON): no morph class on load or re-expand', async () => {
    // Test default: RM ON → animateDockNow=false → instant class swap.
    await renderReader();
    expect((dockPanel() as HTMLElement).className).not.toContain('lawlib-morph-in');
    fireEvent.click(closeDockBtn());
    expect(dockPanel()).toBeNull(); // instant collapse — no closing hold
    fireEvent.click(dockIcon());
    expect((dockPanel() as HTMLElement).className).not.toContain('lawlib-morph-in');
  });

  it('morph gate OFF (animateDock=false): re-expand mounts without the morph', async () => {
    mockMatchMedia({ reducedMotion: false });
    localStorage.setItem('lawlib:settings', JSON.stringify({ fontSize: 16, animateDock: false }));
    await renderReader();
    expect((dockPanel() as HTMLElement).className).not.toContain('lawlib-morph-in');
    fireEvent.click(closeDockBtn());
    expect(dockPanel()).toBeNull(); // instant — no closing hold
    fireEvent.click(dockIcon());
    expect((dockPanel() as HTMLElement).className).not.toContain('lawlib-morph-in');
  });

  it('L1 morph origin follows the position: top-center → top center, mid-left → left center', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    clickPositionInSettings('บนกลาง');
    expect((dockPanel() as HTMLElement).style.transformOrigin).toBe('top center');
    // Reset between picks: Esc closes the settings picker (dock + L2 stay
    // open); toggle L2 shut, let the exit hold finish, then reopen fresh —
    // the position spot click does NOT close the picker, so a second direct
    // helper call would toggle it OFF instead of re-opening.
    fireEvent.keyDown(document, { key: 'Escape' });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    fireEvent.click(moreBtn()); // L2 close (exit hold)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    clickPositionInSettings('กลางซ้าย');
    expect((dockPanel() as HTMLElement).style.transformOrigin).toBe('left center');
  });

  it('vt-dock sits on the ROOT wrapper ONLY — never the panels or the collapsed icon (duplicate VT names skip the transition)', async () => {
    await renderReader();
    const root = document.querySelector('.lawlib-dock.fixed') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.className).toContain('vt-dock');
    document.querySelectorAll('.lawlib-dock').forEach((el) => {
      if (el !== root) expect(el.className).not.toContain('vt-dock');
    });
  });

  it('mobile: sheet morphs from bottom center on RE-EXPAND; the in-flow L2 pops from top center', async () => {
    mockMatchMedia({ mobile: true, reducedMotion: false });
    await renderReader();
    // Default-open load: no morph (user-initiated only).
    expect((dockPanel() as HTMLElement).className).not.toContain('lawlib-morph-in');
    // Collapse → re-expand: the sheet morphs in from its bottom edge.
    fireEvent.click(closeDockBtn());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    fireEvent.click(dockIcon());
    const rePanel = dockPanel() as HTMLElement;
    expect(rePanel.className).toContain('lawlib-morph-in');
    expect(rePanel.style.transformOrigin).toBe('bottom center');
    fireEvent.click(moreBtn());
    const l2 = morePanel() as HTMLElement;
    expect(l2).not.toBeNull();
    expect(l2.className).toContain('lawlib-pop-in');
    expect(l2.style.transformOrigin).toBe('top center');
  });
});

describe('Dock v2.7 — T26 position-change re-trigger + transform raise (ADR-023 D9 locked values)', () => {
  /** The position-change ANIMATION wrapper (T26 AC-1) — the inner div the
   *  enter keyframe + re-trigger live on (never the vt-dock root). */
  const posWrapper = () => document.querySelector('[data-lawlib-pos]') as HTMLElement | null;
  const dockRoot = () => document.querySelector('.lawlib-dock.fixed') as HTMLElement;

  /** The settings picker does NOT auto-close after a selection — reset the
   *  picker + L2 (Esc cascade: picker → L2 → dock) so the ⋯ toggle of
   *  clickPositionInSettings works for a SECOND position switch. */
  function switchPosition(label: string): void {
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Escape' });
    clickPositionInSettings(label);
  }

  it('gate ON: the INNER wrapper carries the directional enter class (up → down → side) — the vt-dock root is untouched', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    // Default bottom-right → slides UP from the bottom edge.
    expect(posWrapper()!.className).toContain('lawlib-dock-pos-in-up');
    // AC-5: the class NEVER lands on the ref'd root; vt-dock stays put.
    const root = dockRoot();
    expect(root.className).not.toContain('lawlib-dock-pos-in');
    expect(root.className).toContain('vt-dock');
    expect(posWrapper()!.className).not.toContain('vt-dock');

    // First switch: helper on the fresh dock (L2 closed).
    clickPositionInSettings('บนซ้าย');
    expect(posWrapper()!.className).toContain('lawlib-dock-pos-in-down');
    expect(dockRoot().className).not.toContain('lawlib-dock-pos-in');

    // Second switch: Esc ×2 (picker → L2) then the helper — the settings
    // picker stays open after a pick, so switchPosition resets it first.
    switchPosition('กลางซ้าย');
    expect(posWrapper()!.className).toContain('lawlib-dock-pos-in-side');
    // Mid positions flip the inline slide var on the root — the wrapper
    // inherits it into the side keyframes.
    expect(dockRoot().style.getPropertyValue('--lawlib-dock-slide')).toBe('-8px');
  });

  it('same-direction move (bottom-left → bottom-right, both up): the two-frame re-trigger restarts even though the class never changes', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    clickPositionInSettings('ล่างซ้าย');
    const wrapper = posWrapper()!;
    expect(wrapper.className).toContain('lawlib-dock-pos-in-up');

    switchPosition('ล่างขวา'); // same animDir — class identical
    expect(wrapper.className).toContain('lawlib-dock-pos-in-up');
    // Phase 1 (effect): `animation: none` is inlined — the engine cancels
    // the finished fill-mode animation at the next frame's style recalc
    // (the class-driven name is re-applied later, so the keyframe
    // restarts). The SAME node is mutated — nothing was key-remounted
    // (a remount would orphan this element and phase 1 would not land).
    // The one-frame flash guard (senior 2026-08-09) ALSO inlines opacity 0
    // — the frame before the restore must never render the wrapper at
    // natural opacity (a full-opacity teleport frame at the NEW spot).
    expect(wrapper.style.animation).toBe('none');
    expect(wrapper.style.opacity).toBe('0');
    // Phase 2 (two rAFs later): the inline is cleared → the class-driven
    // animation is re-created → the enter keyframe restarts (the keyframe
    // owns opacity again).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(wrapper.style.animation).toBe('');
    expect(wrapper.style.opacity).toBe('');
  });

  it('the settings picker STAYS open + anchored after a position switch (reflow re-trigger — never a key-remount)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();
    clickPositionInSettings('บนกลาง');
    // The position spot click does NOT close the picker (T25 pin).
    expect(screen.getByRole('group', { name: 'ตั้งค่า' })).toBeTruthy();
    const l2 = document.getElementById('lawlib-more-panel');
    expect(l2).not.toBeNull();

    // Second switch via the Esc-reset helper — L2 + picker must survive.
    switchPosition('กลางซ้าย');
    expect(screen.getByRole('group', { name: 'ตั้งค่า' })).toBeTruthy();
    expect(document.getElementById('lawlib-more-panel')).not.toBeNull();
  });

  it('gate OFF (animateDock=false): instant class swap — no pos class, no re-trigger inline (AC-3)', async () => {
    mockMatchMedia({ reducedMotion: false });
    localStorage.setItem('lawlib:settings', JSON.stringify({ fontSize: 16, animateDock: false }));
    await renderReader();
    const wrapper = posWrapper()!;
    expect(wrapper.className).not.toContain('lawlib-dock-pos-in');
    expect(wrapper.style.animation).toBe('');
    expect(wrapper.style.opacity).toBe('');

    clickPositionInSettings('บนซ้าย');
    expect(wrapper.className).not.toContain('lawlib-dock-pos-in');
    // The re-trigger effect early-returns under the gate — no 'none' phase,
    // no opacity hold (the wrapper can never be stuck invisible).
    expect(wrapper.style.animation).toBe('');
    expect(wrapper.style.opacity).toBe('');
  });

  it('root: transition-[bottom] is GONE → transition-[transform] duration-100; non-bottom positions get no bottom/raise classes', async () => {
    await renderReader();
    const root = dockRoot();
    expect(root.className).not.toContain('transition-[bottom]');
    expect(root.className).toContain('transition-[transform]');
    expect(root.className).toContain('duration-100');
    // Default bottom-right, at the top (no BackToTop) → flush, not raised.
    expect(root.className).not.toContain('lawlib-dock-raised');

    clickPositionInSettings('บนซ้าย');
    const topLeft = dockRoot();
    expect(topLeft.className).not.toContain('bottom-[');
    expect(topLeft.className).not.toContain('lawlib-dock-raised');
  });
});

describe('Dock v2.3 — mobile-safe panel structure (T12/T15)', () => {
  it('desktop: the L1 TOOLS wrapper has NO max-h/overflow (T20 — no internal scroll); the panel wrapper stays overflow-visible (L2 sibling never clipped)', async () => {
    await renderReader();
    // T20 (user decision 2026-08-09): "I don't need inside the dock to be
    // scrollable" — the tools column's viewport caps + overflow are gone.
    const tools = l1Tools() as HTMLElement;
    expect(tools).not.toBeNull();
    expect(tools.className).not.toContain('overflow-y-auto');
    expect(tools.className).not.toContain('max-h-');
    // …so the panel itself must NOT clip the absolutely-anchored L2 sibling.
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).not.toContain('overflow-y-auto');
    expect(panel.className).not.toContain('overflow-hidden');
  });

  it('mobile: the SHEET carries max-h + overflow-y-auto (in-flow L2 block scrolls with it)', async () => {
    mockMatchMedia({ mobile: true });
    await renderReader();
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain('overflow-y-auto');
    expect(panel.className).toContain('max-h-[min(65vh,34rem)]');
  });
});

describe('Dock v2.4 — position-aware bottom offset (T20/T21, T26 transform raise)', () => {
  // T21 matrix (user decisions 2026-08-09) — the EXACT static class strings.
  // T26 (AC-2): `bottom` is FIXED at the flush value; the BackToTop
  // clearance RAISE became a compositor-only transform class — the old
  // raised bottom class (bottom-[max(size+3.25rem,…)]) is GONE.
  const flushClass = 'bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:bottom-6';
  const mobileClass = 'bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)_+_1.25rem))]';
  const raisedClass = 'lawlib-dock-raised';

  const dockRoot = () => document.querySelector('.lawlib-dock.fixed') as HTMLElement;

  /** jsdom never scrolls — override window.scrollY + dispatch the scroll
   *  event (the dock reads it via the same rAF-throttled listener as
   *  BackToTop). */
  function setScrollY(y: number): void {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
    fireEvent.scroll(window);
  }
  /** The dock throttles scroll via requestAnimationFrame — flush the
   *  callback inside act (jsdom pretendToBeVisual drives rAF on ~16ms). */
  async function flushRaf(): Promise<void> {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
  }

  afterEach(() => {
    // Restore jsdom's own scrollY (undefined>200 is false — harmless), so
    // later describes read a pristine window.
    Reflect.deleteProperty(window, 'scrollY');
  });

  /** The settings picker does NOT auto-close after a selection — reset the
   *  picker + L2 (Esc cascade: picker → L2 → dock) so the ⋯ toggle of
   *  clickPositionInSettings works for a SECOND position switch. */
  function switchPosition(label: string): void {
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Escape' });
    clickPositionInSettings(label);
  }

  it('bottom-center + bottom-left: ALWAYS flush at the bottom (no BackToTop clearance) at any scroll position', async () => {
    await renderReader();
    clickPositionInSettings('ล่างกลาง');

    const center = dockRoot();
    expect(center.className).toContain(flushClass);
    expect(center.className).not.toContain(raisedClass);
    // Scrolled 300px → BackToTop visible, but center can never collide
    // (BackToTop is right-corner) — STILL flush, never raised.
    setScrollY(300);
    await flushRaf();
    expect(dockRoot().className).toContain(flushClass);
    expect(dockRoot().className).not.toContain(raisedClass);

    switchPosition('ล่างซ้าย');
    const left = dockRoot();
    expect(left.className).toContain(flushClass);
    expect(left.className).not.toContain(raisedClass);
    setScrollY(0);
    await flushRaf();
    expect(left.className).toContain(flushClass);
    expect(left.className).not.toContain(raisedClass);
  });

  it('bottom-right: flush at the top → raises via transform once scrolled past 200px → lowers back at the top', async () => {
    await renderReader(); // default position = bottom-right
    const root = dockRoot();
    // T26 (AC-2): `bottom` NEVER moves — the flush class stays on the root
    // through the whole cycle; the raise is the transform class only.
    expect(root.className).toContain(flushClass);
    expect(root.className).not.toContain(raisedClass);

    setScrollY(300);
    await flushRaf();
    const raisedRoot = dockRoot();
    expect(raisedRoot.className).toContain(flushClass); // bottom fixed
    expect(raisedRoot.className).toContain(raisedClass);
    expect(raisedRoot.className).not.toContain('transition-[bottom]');

    setScrollY(0);
    await flushRaf();
    expect(dockRoot().className).toContain(flushClass);
    expect(dockRoot().className).not.toContain(raisedClass);
  });

  it('mobile: bottom positions sit at the navbar clearance (4.75rem); bottom-right RAISES via transform once scrolled past 200px', async () => {
    mockMatchMedia({ mobile: true });
    await renderReader();
    // Default bottom-right on mobile → 4.75rem (76px > BackToTop's mobile
    // 68px ✓ + clears the 64px navbar with a 12px gap).
    expect(dockRoot().className).toContain(mobileClass);
    expect(dockRoot().className).not.toContain(raisedClass);

    // T26 (AC-2): mobile raise = −56px (size + 0.75rem) — the locked
    // mobile delta. The bottom class STAYS 4.75rem; the transform lifts.
    setScrollY(300);
    await flushRaf();
    const raisedRoot = dockRoot();
    expect(raisedRoot.className).toContain(mobileClass);
    expect(raisedRoot.className).toContain(raisedClass);

    // Center position never raises on mobile either.
    clickPositionInSettings('ล่างกลาง');
    expect(dockRoot().className).toContain(mobileClass);
    expect(dockRoot().className).not.toContain(raisedClass);
  });
});

describe('Dock v2.5 — T23 focus mode + auto scroll as dock tools', () => {
  const storedSettings = () =>
    JSON.parse(localStorage.getItem('lawlib:settings') ?? 'null') as Record<string, unknown>;

  it('T23: focusMode/autoScroll are registered tools but NOT in the default favorites (pin-able only)', () => {
    expect(DOCK_TOOL_KEYS).toContain('focusMode');
    expect(DOCK_TOOL_KEYS).toContain('autoScroll');
    expect(DEFAULT_READING_SETTINGS.favoriteToolKeys).not.toContain('focusMode');
    expect(DEFAULT_READING_SETTINGS.favoriteToolKeys).not.toContain('autoScroll');
  });

  it('T23: L2 row 2 (ul:last-child) has the โฟกัส + อ่านอัตโนมัติ toggles (icon-only, aria-pressed)', async () => {
    await renderReader();
    fireEvent.click(moreBtn());
    const row2 = document.querySelector('#lawlib-more-panel ul:last-child') as HTMLElement;
    expect(row2).not.toBeNull();

    const focusBtn = within(row2).getByRole('button', { name: 'โฟกัส' });
    const scrollBtn = within(row2).getByRole('button', { name: 'อ่านอัตโนมัติ' });
    // Genuine toggles (T14 fix): aria-pressed present, OFF at defaults.
    expect(focusBtn.getAttribute('aria-pressed')).toBe('false');
    expect(scrollBtn.getAttribute('aria-pressed')).toBe('false');
    // Icon-only per the L2 convention (labels ride aria-label).
    expect(focusBtn.querySelector('.fi-sr-eye')).not.toBeNull();
    expect(scrollBtn.querySelector('.fi-sr-play')).not.toBeNull();
  });

  it('T23: L2 โฟกัส activates the SAME focus mode as the ⚙️ toggle — dock closes itself, no collapse memory', async () => {
    await renderReader();
    fireEvent.click(moreBtn());
    fireEvent.click(within(morePanel() as HTMLElement).getByRole('button', { name: 'โฟกัส' }));

    expect(storedSettings().focusMode).toBe(true);
    expect(document.body.classList.contains('lawlib-focus')).toBe(true);
    // The dock is part of what focus mode hides — it closes INSTANTLY and
    // must NOT persist a user collapse (programmatic close).
    expect(dockPanel()).toBeNull();
    expect(localStorage.getItem('lawlib:dockCollapsed')).toBeNull();
  });

  it('T23: autoScroll tool toggles speed 0 ↔ last level (default 3 when no history)', async () => {
    await renderReader();
    fireEvent.click(moreBtn());
    // Re-query each time — re-renders replace the button node.
    const scrollBtn = () =>
      within(morePanel() as HTMLElement).getByRole('button', { name: 'อ่านอัตโนมัติ' });

    // OFF → ON: starts at the default level 3.
    fireEvent.click(scrollBtn());
    expect(storedSettings().autoScrollSpeed).toBe(3);
    expect(scrollBtn().getAttribute('aria-pressed')).toBe('true');
    // Active state swaps play → pause (never color-only, WCAG 1.4.1).
    expect(scrollBtn().querySelector('.fi-sr-pause')).not.toBeNull();
    expect(scrollBtn().querySelector('.fi-sr-play')).toBeNull();

    // ON → OFF: saves the level, speed 0.
    fireEvent.click(scrollBtn());
    expect(storedSettings().autoScrollSpeed).toBe(0);
    expect(scrollBtn().getAttribute('aria-pressed')).toBe('false');
    expect(scrollBtn().querySelector('.fi-sr-play')).not.toBeNull();

    // OFF → ON again: restores the remembered level (3).
    fireEvent.click(scrollBtn());
    expect(storedSettings().autoScrollSpeed).toBe(3);
  });

  it('T23: toggling OFF saves the CURRENT level — ON restores it, not the default 3', async () => {
    localStorage.setItem('lawlib:settings', JSON.stringify({ autoScrollSpeed: 4 }));
    await renderReader();
    fireEvent.click(moreBtn());
    const scrollBtn = () =>
      within(morePanel() as HTMLElement).getByRole('button', { name: 'อ่านอัตโนมัติ' });

    fireEvent.click(scrollBtn()); // ON(4) → OFF: saves 4.
    expect(storedSettings().autoScrollSpeed).toBe(0);
    fireEvent.click(scrollBtn()); // OFF → ON: restores 4.
    expect(storedSettings().autoScrollSpeed).toBe(4);
  });

  it('T23: pinned L1 โฟกัส/อ่านอัตโนมัติ render as toggle buttons with active states from settings', async () => {
    localStorage.setItem(
      'lawlib:settings',
      JSON.stringify({
        favoriteToolKeys: ['focusMode', 'autoScroll'],
        focusMode: true,
        autoScrollSpeed: 3,
      }),
    );
    await renderReader();

    const focusBtn = screen.getByRole('button', { name: 'โฟกัส' });
    const scrollBtn = screen.getByRole('button', { name: 'อ่านอัตโนมัติ' });
    expect(focusBtn.getAttribute('aria-pressed')).toBe('true');
    expect(scrollBtn.getAttribute('aria-pressed')).toBe('true');
    // AutoScroll active → pause glyph; focus keeps its eye.
    expect(scrollBtn.querySelector('.fi-sr-pause')).not.toBeNull();
    expect(scrollBtn.querySelector('.fi-sr-play')).toBeNull();
    expect(focusBtn.querySelector('.fi-sr-eye')).not.toBeNull();
    // The L1 toggles act too: clicking autoScroll turns it off (level saved).
    fireEvent.click(scrollBtn);
    expect(storedSettings().autoScrollSpeed).toBe(0);
    expect(screen.getByRole('button', { name: 'อ่านอัตโนมัติ' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('T23: L2 favorites row 1 dedups — the new tools move from row 2 to row 1 when pinned', async () => {
    localStorage.setItem(
      'lawlib:settings',
      JSON.stringify({ favoriteToolKeys: ['autoScroll', 'theme'] }),
    );
    await renderReader();
    fireEvent.click(moreBtn());

    // Row 1 (ul:first-child) carries the pinned autoScroll…
    const row1 = document.querySelector('#lawlib-more-panel ul:first-child') as HTMLElement;
    expect(within(row1).getByRole('button', { name: 'อ่านอัตโนมัติ' })).toBeTruthy();
    // …and row 2 no longer duplicates it (the L2 panel shows ONE instance).
    const row2 = document.querySelector('#lawlib-more-panel ul:last-child') as HTMLElement;
    expect(within(row2).queryByRole('button', { name: 'อ่านอัตโนมัติ' })).toBeNull();
    // Unpinned focusMode stays in row 2.
    expect(within(row2).getByRole('button', { name: 'โฟกัส' })).toBeTruthy();
  });
});
