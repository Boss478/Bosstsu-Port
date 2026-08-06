// @vitest-environment jsdom
/**
 * LawlibDock v2 (T10a — ADR-019 D1/D2/D3/D6) contract tests.
 *
 * The dock is exercised THROUGH the full reader client:
 * `<ThemeProvider><LawlibReaderClient law={sampleLaw} /></ThemeProvider>`
 * (module-local wiring precedent — the dock is a real component importing the
 * reader's storage/theme state).
 *
 * Pinned here:
 * - Level 0 · ยุบ: ONE plain tools icon (aria-expanded=false, no badge)
 * - click expands the Level-1 panel; picker buttons SHOW CURRENT VALUES
 *   (16px / 1.8 / 60 / theme label)
 * - panel STAYS OPEN after actions (picker open, option picked) — no
 *   auto-collapse (D1)
 * - close paths: Esc (focus returns to the icon) · pointerdown-outside ·
 *   re-click the tools icon
 * - pickers: click-to-expand popover (aria-expanded), DIRECT choice (no
 *   cycling), Esc closes the popover
 * - bookmark: toggle + aria-pressed + count badge
 * - Level 2 "เพิ่มเติม": ALL tools + per-tool pin (favorites move to
 *   Level 1) + the 8-position selector (3×3 minus center) + ย้อนกลับ
 * - mobile-safe panel: flex-wrap rows + max-h + overflow-y-auto (375px
 *   manual smoke covers the pixel-level check)
 *
 * jsdom gaps stubbed: matchMedia, IntersectionObserver (TocSidebar
 * scroll-spy), localStorage (in-memory store). `next/link` renders a plain
 * <a> (no router in jsdom).
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

/** jsdom has no matchMedia — stub it; `matches` = OS dark-mode state. */
function mockMatchMedia(matches: boolean): void {
  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
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

const dockIcon = () => screen.getByRole('button', { name: 'เครื่องมืออ่าน' });
const dockPanel = () => document.getElementById('lawlib-dock-panel');

beforeEach(() => {
  mockLocalStorage();
  mockMatchMedia(false);
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

describe('Dock v2 — Level 0 (collapsed)', () => {
  it('renders ONE plain tools icon: aria-expanded=false, aria-controls the panel, NO badge', async () => {
    await renderReader();

    const icon = dockIcon();
    expect(icon.getAttribute('aria-expanded')).toBe('false');
    expect(icon.getAttribute('aria-controls')).toBe('lawlib-dock-panel');
    expect(dockPanel()).toBeNull();
    // No badge inside the collapsed icon (D1 — plain tools icon).
    expect(within(icon).queryByText(/^\d+$/)).toBeNull();
  });
});

describe('Dock v2 — Level 1 (expanded favorites)', () => {
  it('click expands the panel with the default curated row showing CURRENT values', async () => {
    await renderReader();

    fireEvent.click(dockIcon());
    const panel = dockPanel();
    expect(panel).not.toBeNull();
    // The collapsed icon is replaced by the panel header (re-click collapses).
    expect(
      screen.getByRole('button', { name: 'ย่อแถบเครื่องมือ' }).getAttribute('aria-expanded'),
    ).toBe('true');

    // The four pickers show their CURRENT values (theme label / px / lh / ch).
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    expect(themeBtn.textContent).toContain('สว่าง');
    const fontSizeBtn = screen.getByRole('button', { name: /ตัวอักษร/ });
    expect(fontSizeBtn.textContent).toContain('16px');
    const lineHeightBtn = screen.getByRole('button', { name: /บรรทัด/ });
    expect(lineHeightBtn.textContent).toContain('1.8');
    const widthBtn = screen.getByRole('button', { name: /กว้าง/ });
    expect(widthBtn.textContent).toContain('60');

    // Quick actions + เพิ่มเติม.
    expect(screen.getByRole('button', { name: 'ที่คั่นหน้า' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ค้นหามาตรา' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'บันทึกของฉัน' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'เพิ่มเติม' })).toBeTruthy();
  });

  it('panel STAYS OPEN after opening a picker and after picking an option (no auto-collapse, D1)', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    expect(dockPanel()).not.toBeNull();

    // Open the theme picker → panel + popover both stay.
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    fireEvent.click(themeBtn);
    expect(themeBtn.getAttribute('aria-expanded')).toBe('true');
    expect(dockPanel()).not.toBeNull();
    expect(screen.getByRole('dialog', { name: 'ธีม' })).toBeTruthy();

    // DIRECT choice — pick ธีมมืด → applied immediately, still no collapse.
    fireEvent.click(screen.getByRole('button', { name: 'ธีมมืด' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(dockPanel()).not.toBeNull();
    // The picker button now shows the NEW current value.
    expect(themeBtn.textContent).toContain('มืด');
  });

  it('font size picker: −/+ steppers + preset chips change the value directly', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
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
    fireEvent.click(dockIcon());

    const lineHeightBtn = screen.getByRole('button', { name: /บรรทัด/ });
    fireEvent.click(lineHeightBtn);
    const lhSlider = screen.getByRole('slider', { name: 'ความสูงบรรทัด' });
    fireEvent.change(lhSlider, { target: { value: '1.2' } });
    expect(lineHeightBtn.textContent).toContain('1.2');
    fireEvent.keyDown(document, { key: 'Escape' });

    const widthBtn = screen.getByRole('button', { name: /กว้าง/ });
    fireEvent.click(widthBtn);
    const widthSlider = screen.getByRole('slider', { name: 'ความกว้างเนื้อหา' });
    fireEvent.change(widthSlider, { target: { value: '70' } });
    expect(widthBtn.textContent).toContain('70');
  });

  it('picker popover closes on Esc; the panel stays open (Esc cascades)', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    fireEvent.click(themeBtn);
    expect(screen.getByRole('dialog', { name: 'ธีม' })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'ธีม' })).toBeNull();
    expect(dockPanel()).not.toBeNull();
  });

  it('bookmark button: toggle + aria-pressed + count badge', async () => {
    await renderReader();
    fireEvent.click(dockIcon());

    const bookmarkBtn = screen.getByRole('button', { name: 'ที่คั่นหน้า' });
    expect(bookmarkBtn.getAttribute('aria-pressed')).toBe('false');
    expect(within(bookmarkBtn).queryByText('1')).toBeNull();

    fireEvent.click(bookmarkBtn);
    expect(bookmarkBtn.getAttribute('aria-pressed')).toBe('true');
    // Badge + AA pin: white 10px-bold on red-600 ≥ 4.5:1 (red-500 was 3.79:1).
    const badge = within(bookmarkBtn).getByText('1');
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('bg-red-600');

    fireEvent.click(bookmarkBtn);
    expect(bookmarkBtn.getAttribute('aria-pressed')).toBe('false');
    expect(within(bookmarkBtn).queryByText('1')).toBeNull();
  });
});

describe('Dock v2 — close paths (stays open until explicitly closed)', () => {
  it('Esc closes the panel and returns focus to the tools icon', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    expect(dockPanel()).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dockPanel()).toBeNull();
    // The focus restore is deferred until the collapsed icon remounts.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(screen.getByRole('button', { name: 'เครื่องมืออ่าน' })).toBe(document.activeElement);
  });

  it('Esc from an open picker closes ONLY the picker and returns focus to its anchor', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    const themeBtn = screen.getByRole('button', { name: /ธีม/ });
    fireEvent.click(themeBtn);
    expect(screen.getByRole('dialog', { name: 'ธีม' })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'ธีม' })).toBeNull();
    // Focus must NOT drop to <body> — the picker's trigger button gets it.
    expect(themeBtn).toBe(document.activeElement);
    // Esc cascades: the panel itself stays open.
    expect(dockPanel()).not.toBeNull();
  });

  it('panel X-close restores focus to the collapsed tools icon (Esc parity)', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    expect(dockPanel()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'ปิดแถบเครื่องมือ' }));
    expect(dockPanel()).toBeNull();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(screen.getByRole('button', { name: 'เครื่องมืออ่าน' })).toBe(document.activeElement);
  });

  it('re-clicking the tools icon collapses the panel', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    expect(dockPanel()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'ย่อแถบเครื่องมือ' }));
    expect(dockPanel()).toBeNull();
    expect(screen.getByRole('button', { name: 'เครื่องมืออ่าน' })).toBeTruthy();
  });

  it('pointerdown outside the dock closes it (but NOT clicks inside the panel)', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    expect(dockPanel()).not.toBeNull();

    // A click inside the panel must not close it.
    fireEvent.pointerDown(screen.getByRole('button', { name: 'ค้นหามาตรา' }));
    expect(dockPanel()).not.toBeNull();

    fireEvent.pointerDown(document.body);
    expect(dockPanel()).toBeNull();
  });
});

describe('Dock v2 — Level 2 (เพิ่มเติม)', () => {
  it('เพิ่มเติม swaps to ALL tools with ย้อนกลับ back + per-tool pin toggles', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));

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

  it('position selector: 8 spots (3×3 minus center), persisted to localStorage', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));

    const group = screen.getByRole('group', { name: 'ตำแหน่งปุ่มเครื่องมือ' });
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

  it('mid-left position clamps the panel width to 100vw − icon footprint (375px no-overflow)', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
    fireEvent.click(screen.getByRole('button', { name: 'ตำแหน่งกลางซ้าย' }));

    // Side-anchored panels must not exceed the viewport: at 375px the shared
    // 92vw cap (345px) plus the 60px icon offset would overflow by 30px.
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain('w-[min(calc(100vw-3.75rem),26rem)]');
  });

  it('bookmarks list in Level 2: grouped chapter rows with jump + delete', async () => {
    await renderReader();
    fireEvent.click(dockIcon());

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

describe('Dock v2 — mobile-safe panel structure', () => {
  it('panel carries wrap + max-h + overflow-y-auto (375px no-overflow contract)', async () => {
    await renderReader();
    fireEvent.click(dockIcon());
    const panel = dockPanel() as HTMLElement;
    expect(panel.className).toContain('overflow-y-auto');
    expect(panel.className).toContain('max-h-');
    // The Level-1 favorites row wraps to 2 rows on narrow screens.
    expect(panel.querySelector('[class*="flex-wrap"]')).not.toBeNull();
  });
});
