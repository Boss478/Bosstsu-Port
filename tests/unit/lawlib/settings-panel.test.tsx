// @vitest-environment jsdom
/**
 * T10b — Settings panel (⚙️, ADR-019 D4/D7/D8) contract tests.
 *
 * Exercised THROUGH the full reader client (same harness as
 * reading-dock.test.tsx): `<ThemeProvider><LawlibReaderClient/></ThemeProvider>`.
 *
 * Pinned here:
 * - ⚙️ opens the settings picker from Level 2 (live row, no longer disabled)
 * - every slider persists through the shared validator to `lawlib:settings`
 * - font family selection applies to the reader root (--lawlib-font-family)
 * - hide repealed / hide amendment notes set the body class hooks
 *   (FULL+COMPACT share ArticleView/.lawlib-repealed + the tooltip block)
 * - focus mode: will-hide disclosure visible BEFORE activating; activating
 *   sets body.lawlib-focus AND closes the dock; Esc exits (escBlocked-aware)
 * - reset: inline confirm → settings + favorites + dock position + paper
 *   tone all back to defaults (bookmarks untouched)
 * - T12c: dock position section — 8-spot grid + per-setting reset (the
 *   selector MOVED here from Level 2; Level 2 no longer renders it)
 * - toolbar slider floors at 44 on coarse pointers (WCAG 2.5.8)
 * - auto-scroll: speed > 0 shows the control chip; 0 hides it
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

/** Query-aware matchMedia — `queryResponse` maps query substrings → matches. */
function mockMatchMedia(queryResponse: Array<[string, boolean]>): void {
  const mqlFor = (query: string): MediaQueryList =>
    ({
      matches: queryResponse.some(([q, m]) => query.includes(q) && m),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
  window.matchMedia = vi.fn((query: string) =>
    mqlFor(query),
  ) as unknown as typeof window.matchMedia;
}

/** jsdom has no IntersectionObserver — the reading indicator needs it. */
class IntersectionObserverStub {
  readonly root: Element | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

beforeEach(() => {
  mockLocalStorage();
  mockMatchMedia([]);
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  document.documentElement.className = '';
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-motion');
  document.body.className = '';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderReader() {
  const utils = render(
    <ThemeProvider>
      <LawlibReaderClient law={sampleLaw} digestView={null} />
    </ThemeProvider>,
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  return utils;
}

/** Level 1 is OPEN BY DEFAULT (T12) — เพิ่มเติม → ⚙️ settings picker.
 *  Returns the picker group. */
async function openSettings() {
  fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
  fireEvent.click(screen.getByRole('button', { name: /^ตั้งค่า/ }));
  const picker = screen.getByRole('group', { name: 'ตั้งค่า' });
  return picker;
}

const storedSettings = () =>
  JSON.parse(localStorage.getItem('lawlib:settings') ?? 'null') as Record<string, unknown>;

/** The curated Level-1 default row (DEFAULT_READING_SETTINGS.favoriteToolKeys). */
const DEFAULT_FAVORITE_KEYS_EXPECTED = [
  'theme',
  'fontSize',
  'lineHeight',
  'width',
  'bookmark',
  'search',
  'notes',
] as const;

describe('T10b settings panel — ⚙️ wiring', () => {
  it('opens the settings picker from Level 2 with the section headings', async () => {
    await renderReader();
    const picker = await openSettings();
    expect(within(picker).getByRole('heading', { name: 'ฟอนต์ตัวบท' })).toBeTruthy();
    expect(
      within(picker).getByRole('heading', { name: 'ความโปร่งใสของแถบเครื่องมือ' }),
    ).toBeTruthy();
    expect(within(picker).getByRole('heading', { name: 'ขนาดแถบเครื่องมือ' })).toBeTruthy();
    // T12c: the dock position section moved here from Level 2.
    expect(within(picker).getByRole('heading', { name: 'ตำแหน่งปุ่มเครื่องมือ' })).toBeTruthy();
    expect(within(picker).getByRole('heading', { name: 'โหมดโฟกัส' })).toBeTruthy();
    expect(within(picker).getByRole('heading', { name: 'รีเซ็ต' })).toBeTruthy();
    // NOT a dialog — the PickerPopover group stays non-modal (no nesting).
    expect(picker.getAttribute('role')).toBe('group');
  });

  it('T54: 3 group headers in order — กราฟิก → ตัวอักษร → เครื่องมือ (quick section gone)', async () => {
    await renderReader();
    const picker = await openSettings();
    // Group headers are h2 and appear in the locked order; section titles
    // inside groups are h3 (ADR-026 W6 / T54).
    const h2 = within(picker).getAllByRole('heading', { level: 2 });
    expect(h2.map((el) => el.textContent)).toEqual(['กราฟิก', 'ตัวอักษร', 'เครื่องมือ', 'รีเซ็ต']);
    // The T47 quick section header must be GONE (T54 — user decision).
    expect(within(picker).queryByRole('heading', { name: 'สำคัญ' })).toBeNull();
    // Sections render as h3 inside their groups (the level prop).
    expect(within(picker).getByRole('heading', { level: 3, name: 'ธีม' })).toBeTruthy();
    expect(within(picker).getByRole('heading', { level: 3, name: 'เลื่อนอัตโนมัติ' })).toBeTruthy();
  });

  it('T54: the glass slider (กราฟิก group) renders ABOVE the typography sections (ตัวอักษร group, DOM order)', async () => {
    await renderReader();
    const picker = await openSettings();
    // T54 (ADR-026 W6) — group order: กราฟิก (กระจก) comes before ตัวอักษร
    // (ขนาดตัวอักษร), so the glass slider must precede the first typography
    // section in document order.
    const glass = within(picker).getByLabelText('กระจก (ความทึบ + ความเบลอ)');
    const typography = within(picker).getByRole('heading', { name: 'ขนาดตัวอักษร' });
    expect(
      (glass.compareDocumentPosition(typography) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    ).toBe(true);
  });

  it('glass slider persists through the shared validator', async () => {
    await renderReader();
    const picker = await openSettings();
    // Label is the ADR-025 §3 user-locked name (T40 changed it in-tree).
    const slider = within(picker).getByLabelText('กระจก (ความทึบ + ความเบลอ)');
    // T48 (ADR-025 S1): default 50 — was 35 (T12), 75 (v1.11.1 shipped).
    expect((slider as HTMLInputElement).value).toBe('50');
    fireEvent.change(slider, { target: { value: '100' } });
    expect(storedSettings().glassOpacity).toBe(100);
    fireEvent.change(slider, { target: { value: '0' } });
    expect(storedSettings().glassOpacity).toBe(0);
  });

  it('toolbar size slider: 24-56 default 44; 44 floor on coarse pointers (2.5.8)', async () => {
    await renderReader();
    const picker = await openSettings();
    const slider = within(picker).getByLabelText('ขนาดปุ่มเครื่องมือ') as HTMLInputElement;
    expect(slider.value).toBe('44');
    expect(slider.min).toBe('24');
    fireEvent.change(slider, { target: { value: '56' } });
    expect(storedSettings().toolbarSize).toBe(56);
    // The dock root carries the size var.
    const root = document.querySelector('.lawlib-dock.fixed') as HTMLElement;
    expect(root.style.getPropertyValue('--lawlib-dock-size')).toBe('56px');
  });

  it('coarse pointer (touch) floors the toolbar slider at 44', async () => {
    mockMatchMedia([['(pointer: coarse)', true]]);
    await renderReader();
    const picker = await openSettings();
    const slider = within(picker).getByLabelText('ขนาดปุ่มเครื่องมือ') as HTMLInputElement;
    expect(slider.min).toBe('44');
  });

  it('font family: 5 choices, selection persists + applies to the reader root', async () => {
    await renderReader();
    const picker = await openSettings();
    expect(within(picker).getByRole('button', { name: 'ฟอนต์ Itim' })).toBeTruthy();
    expect(within(picker).getByRole('button', { name: 'ฟอนต์ Bai Jamjuree' })).toBeTruthy();
    expect(within(picker).getByRole('button', { name: 'ฟอนต์ Noto Sans Thai' })).toBeTruthy();
    fireEvent.click(within(picker).getByRole('button', { name: 'ฟอนต์ Itim' }));
    expect(storedSettings().fontFamily).toBe('itim');
    const readerRoot = document.querySelector('[style*="--lawlib-font-family"]') as HTMLElement;
    expect(readerRoot.style.getPropertyValue('--lawlib-font-family')).toBe("'Itim'");
  });

  it('hide repealed + hide amendment notes set the body hooks (FULL+COMPACT)', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('switch', { name: 'ซ่อนมาตรา/วรรคที่ถูกยกเลิก' }));
    expect(document.body.classList.contains('lawlib-hide-repealed')).toBe(true);
    expect(storedSettings().hideRepealed).toBe(true);
    fireEvent.click(within(picker).getByRole('switch', { name: 'ซ่อนโน้ตการแก้ไข' }));
    expect(document.body.classList.contains('lawlib-hide-amendment-notes')).toBe(true);
    // Toggle off cleans up.
    fireEvent.click(within(picker).getByRole('switch', { name: 'ซ่อนมาตรา/วรรคที่ถูกยกเลิก' }));
    expect(document.body.classList.contains('lawlib-hide-repealed')).toBe(false);
  });

  it('font weight options persist', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('button', { name: 'ความหนาตัวอักษรหนา' }));
    expect(storedSettings().fontWeight).toBe('bold');
  });

  it('T50: ONE line-spacing control — ระยะห่างย่อหน้า row gone, merged hint shows', async () => {
    await renderReader();
    const picker = await openSettings();
    // The merged control (ADR-026 W2 — user decision 2026-08-11): the old
    // paragraph-spacing row must NOT render anywhere in the panel…
    expect(within(picker).queryByRole('button', { name: /ระยะห่างย่อหน้า/ })).toBeNull();
    expect(within(picker).queryByText('เฉพาะเวอร์ชันย่อ')).toBeNull();
    // …and the line-height section carries the "รวมระยะห่างย่อหน้า" hint.
    expect(within(picker).getByText('รวมระยะห่างย่อหน้า')).toBeTruthy();
    // The line-height slider is still there (it now drives both).
    expect(within(picker).getByRole('slider', { name: 'ความสูงบรรทัด' })).toBeTruthy();
  });
});

describe('T10b settings panel — focus mode', () => {
  it('discloses what will be hidden BEFORE the toggle can be flipped', async () => {
    await renderReader();
    const picker = await openSettings();
    expect(
      within(picker).getByText(/จะซ่อน: เมนูนำทาง, สารบัญ, แถบเครื่องมือ, footer/),
    ).toBeTruthy();
  });

  it('activating focus mode sets body.lawlib-focus AND closes the dock', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('switch', { name: 'เปิดโหมดโฟกัส' }));
    // T31 (AC-2): the chrome hides at t=0 — the body class lands
    // INSTANTLY and the reading surface fades in over 500ms (M9, ADR-025 —
    // the wait below just lets the fade-in finish; reduced-motion = instant).
    expect(document.body.classList.contains('lawlib-focus')).toBe(true);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 320));
    });
    expect(document.body.classList.contains('lawlib-focus')).toBe(true);
    expect(storedSettings().focusMode).toBe(true);
    // The dock (and its picker portal) is part of what focus mode hides —
    // it must be closed so nothing floats.
    expect(document.getElementById('lawlib-dock-panel')).toBeNull();
  });

  it('Esc exits focus mode (and does nothing while a drawer owns Escape)', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('switch', { name: 'เปิดโหมดโฟกัส' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    // The setting flips synchronously; the chrome returns after the
    // 500ms surface fade-out (M9 — the class lands last).
    expect(storedSettings().focusMode).toBe(false);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 520));
    });
    expect(document.body.classList.contains('lawlib-focus')).toBe(false);
  });

  it('T12: Esc during focus mode NEVER persists a user collapse (dock hidden — its Esc handler stands down)', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('switch', { name: 'เปิดโหมดโฟกัส' }));
    // The dock closed itself on activation (closeAllInstant) — no memory.
    expect(localStorage.getItem('lawlib:dockCollapsed')).toBeNull();

    // Esc exits focus mode through the READER handler; the dock's own Esc
    // handler is stood down (it is display:none) — the hidden dock must not
    // be collapsed AND remembered as a user collapse. The chrome returns
    // after the 500ms surface fade-out (M9, ADR-025 — T31 two-step).
    fireEvent.keyDown(document, { key: 'Escape' });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 520));
    });
    expect(document.body.classList.contains('lawlib-focus')).toBe(false);
    expect(localStorage.getItem('lawlib:dockCollapsed')).toBeNull();
  });
});

describe('T10b settings panel — auto-scroll + reset', () => {
  it('auto-scroll slider: 0 = ปิด, >0 shows the control chip', async () => {
    await renderReader();
    const picker = await openSettings();
    const slider = within(picker).getByLabelText('ความเร็ว') as HTMLInputElement;
    expect(slider.min).toBe('0');
    expect(slider.max).toBe('5');
    expect(screen.queryByRole('button', { name: /หยุดชั่วคราว/ })).toBeNull();
    fireEvent.change(slider, { target: { value: '2' } });
    expect(storedSettings().autoScrollSpeed).toBe(2);
    expect(screen.getByRole('button', { name: /หยุดชั่วคราว/ })).toBeTruthy();
    // Stop button turns the feature off again. T30 (AC-3): with motion
    // enabled (this suite's default) the chip holds 150ms for the exit
    // fade — the SPEED is 0 immediately, the chip unmounts after the hold.
    fireEvent.click(screen.getByRole('button', { name: 'ปิดเลื่อนอัตโนมัติ' }));
    expect(storedSettings().autoScrollSpeed).toBe(0);
    expect(screen.queryByRole('button', { name: /หยุดชั่วคราว/ })).toBeTruthy();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    expect(screen.queryByRole('button', { name: /หยุดชั่วคราว/ })).toBeNull();
  });

  it('T12c: dock position section — 8 spots, default bottom-right, click persists, per-setting reset', async () => {
    await renderReader();
    const picker = await openSettings();
    const group = within(picker).getByRole('group', { name: 'ตำแหน่งปุ่มเครื่องมือ' });
    expect(within(group).getAllByRole('button').length).toBe(8);
    expect(
      within(group).getByRole('button', { name: 'ตำแหน่งล่างขวา' }).getAttribute('aria-pressed'),
    ).toBe('true');
    // The per-setting คืนค่า is disabled at the default position.
    expect(
      (
        within(picker).getByRole('button', {
          name: 'คืนค่าตำแหน่งปุ่มเครื่องมือ',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    fireEvent.click(within(group).getByRole('button', { name: 'ตำแหน่งกลางซ้าย' }));
    expect(localStorage.getItem('lawlib:dockPosition')).toBe('mid-left');
    expect(
      within(group).getByRole('button', { name: 'ตำแหน่งกลางซ้าย' }).getAttribute('aria-pressed'),
    ).toBe('true');

    // Per-setting reset → back to the default position.
    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าตำแหน่งปุ่มเครื่องมือ' }));
    expect(localStorage.getItem('lawlib:dockPosition')).toBe('bottom-right');
  });

  it('reset: inline confirm wipes settings + favorites + position + paper tone', async () => {
    // Set some state first: settings + a position + a paper tone.
    localStorage.setItem('lawlib:settings', JSON.stringify({ fontSize: 24 }));
    localStorage.setItem('lawlib:dockPosition', 'top-left');
    localStorage.setItem('lawlib:paperTone', '80');
    await renderReader();
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
    fireEvent.click(screen.getByRole('button', { name: /^ตั้งค่า/ }));
    const picker = screen.getByRole('group', { name: 'ตั้งค่า' });

    fireEvent.click(within(picker).getByRole('button', { name: /คืนค่าเริ่มต้น/ }));
    // Confirm step is explicit — the wipe must not happen on first click.
    expect(localStorage.getItem('lawlib:dockPosition')).toBe('top-left');
    fireEvent.click(within(picker).getByRole('button', { name: 'ยืนยัน' }));

    expect(JSON.parse(localStorage.getItem('lawlib:settings') ?? 'null')).toEqual({
      fontSize: 16,
      lineHeight: 1.8,
      width: 120,
      favoriteToolKeys: ['theme', 'fontSize', 'lineHeight', 'width', 'bookmark', 'search', 'notes'],
      fontFamily: 'sarabun',
      glassOpacity: 50,
      toolbarSize: 44,
      fontWeight: 'normal',
      hideRepealed: false,
      hideAmendmentNotes: false,
      focusMode: false,
      autoScrollSpeed: 0,
      animateDock: true,
      // T42 (ADR-025 D2) — the 3-tier motion preference resets with it.
      motionPreference: 'quality',
    });
    expect(localStorage.getItem('lawlib:dockPosition')).toBe('bottom-right');
    expect(localStorage.getItem('lawlib:paperTone')).toBe('50');
    // Position selector reflects the reset live.
    expect(
      within(screen.getByRole('group', { name: 'ตำแหน่งปุ่มเครื่องมือ' }))
        .getByRole('button', {
          name: 'ตำแหน่งล่างขวา',
        })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });
});

describe('T12 settings panel — per-setting คืนค่า resets (ADR-019 D9)', () => {
  it('every reset button is DISABLED at its default value', async () => {
    await renderReader();
    const picker = await openSettings();
    // A representative sample: slider (glass), toggle (hide repealed),
    // option group (font family), section action (auto-scroll).
    expect(
      (within(picker).getByRole('button', { name: 'คืนค่าความทึบ' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (within(picker).getByRole('button', { name: 'คืนค่าซ่อนมาตรา' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (within(picker).getByRole('button', { name: 'คืนค่าฟอนต์ตัวบท' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (
        within(picker).getByRole('button', {
          name: 'คืนค่าความเร็วเลื่อนอัตโนมัติ',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('glass slider: คืนค่า resets ONLY glassOpacity (50) — other settings untouched', async () => {
    await renderReader();
    const picker = await openSettings();
    const slider = within(picker).getByLabelText('กระจก (ความทึบ + ความเบลอ)');
    fireEvent.change(slider, { target: { value: '100' } });
    expect(storedSettings().glassOpacity).toBe(100);

    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าความทึบ' }));
    expect(storedSettings().glassOpacity).toBe(50);
    // ONLY the glass slider moved — the sibling toolbar size stays default.
    expect(storedSettings().toolbarSize).toBe(44);
  });

  it('toolbar size: คืนค่า resets to 44', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.change(within(picker).getByLabelText('ขนาดปุ่มเครื่องมือ'), {
      target: { value: '56' },
    });
    expect(storedSettings().toolbarSize).toBe(56);

    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าขนาดปุ่ม' }));
    expect(storedSettings().toolbarSize).toBe(44);
  });

  it('font family: คืนค่า resets to sarabun', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('button', { name: 'ฟอนต์ Itim' }));
    expect(storedSettings().fontFamily).toBe('itim');

    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าฟอนต์ตัวบท' }));
    expect(storedSettings().fontFamily).toBe('sarabun');
  });

  it('font weight: คืนค่า resets only itself', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('button', { name: 'ความหนาตัวอักษรหนา' }));
    expect(storedSettings().fontWeight).toBe('bold');

    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าความหนาตัวอักษร' }));
    expect(storedSettings().fontWeight).toBe('normal');
  });

  it('content toggles: each คืนค่า resets only itself', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('switch', { name: 'ซ่อนมาตรา/วรรคที่ถูกยกเลิก' }));
    fireEvent.click(within(picker).getByRole('switch', { name: 'ซ่อนโน้ตการแก้ไข' }));
    expect(storedSettings().hideRepealed).toBe(true);
    expect(storedSettings().hideAmendmentNotes).toBe(true);

    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าซ่อนมาตรา' }));
    expect(storedSettings().hideRepealed).toBe(false);
    expect(storedSettings().hideAmendmentNotes).toBe(true);

    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าซ่อนโน้ต' }));
    expect(storedSettings().hideAmendmentNotes).toBe(false);
  });

  it('auto-scroll: คืนค่า resets speed to 0 (off)', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.change(within(picker).getByLabelText('ความเร็ว'), { target: { value: '3' } });
    expect(storedSettings().autoScrollSpeed).toBe(3);

    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าความเร็วเลื่อนอัตโนมัติ' }));
    expect(storedSettings().autoScrollSpeed).toBe(0);
  });

  it('animateDock toggle: switch + per-setting reset (default ON)', async () => {
    await renderReader();
    const picker = await openSettings();
    // The new T12 section renders.
    expect(within(picker).getByRole('heading', { name: 'แอนิเมชัน' })).toBeTruthy();

    // Default ON → the reset is disabled (already the default).
    const resetBtn = within(picker).getByRole('button', {
      name: 'คืนค่าแอนิเมชัน',
    }) as HTMLButtonElement;
    expect(resetBtn.disabled).toBe(true);
    const toggle = within(picker).getByRole('switch', { name: 'แอนิเมชันแถบเครื่องมือ' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    // Switch off → persisted; reset re-enables → back to ON.
    fireEvent.click(toggle);
    expect(storedSettings().animateDock).toBe(false);
    expect(resetBtn.disabled).toBe(false);
    fireEvent.click(resetBtn);
    expect(storedSettings().animateDock).toBe(true);
    expect(
      (
        within(picker).getByRole('switch', { name: 'แอนิเมชันแถบเครื่องมือ' }) as HTMLButtonElement
      ).getAttribute('aria-checked'),
    ).toBe('true');
  });
});

describe('T14 settings panel — เครื่องมือแถวลัด favorites editor (ADR-019 D10)', () => {
  it('renders one switch per tool (13 total); the curated 7 start checked; per-setting reset disabled', async () => {
    await renderReader();
    const picker = await openSettings();
    expect(within(picker).getByRole('heading', { name: 'เครื่องมือแถวลัด' })).toBeTruthy();

    const switches = within(picker).getAllByRole('switch');
    // 13 tool switches (T23 — + focusMode + autoScroll) + 3 content/
    // animation switches (hide repealed, hide amendment notes, animateDock)
    // + focus-mode switch.
    const favSwitches = switches.filter((s) => s.id.startsWith('lawlib-fav-'));
    expect(favSwitches.length).toBe(13);
    // The curated default row is checked.
    for (const name of [
      'ธีม',
      'ตัวอักษร',
      'บรรทัด',
      'กว้าง',
      'ที่คั่นหน้า',
      'ค้นหามาตรา',
      'บันทึกของฉัน',
    ]) {
      expect(within(picker).getByRole('switch', { name }).getAttribute('aria-checked')).toBe(
        'true',
      );
    }
    expect(
      within(picker).getByRole('switch', { name: 'บทนิยาม' }).getAttribute('aria-checked'),
    ).toBe('false');
    // T23 — the new tools render as switches (pinnable) but are NOT in the
    // default favorites.
    expect(within(picker).getByRole('switch', { name: 'โฟกัส' }).getAttribute('aria-checked')).toBe(
      'false',
    );
    expect(
      within(picker).getByRole('switch', { name: 'อ่านอัตโนมัติ' }).getAttribute('aria-checked'),
    ).toBe('false');
    // Per-setting คืนค่า disabled at the curated default.
    expect(
      (within(picker).getByRole('button', { name: 'คืนค่าเครื่องมือแถวลัด' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('unpin ธีม → Level 1 loses the theme picker; Level 2 row 2 gains it', async () => {
    await renderReader();
    expect(screen.getByRole('button', { name: /ธีม/ })).toBeTruthy();
    const picker = await openSettings();

    fireEvent.click(within(picker).getByRole('switch', { name: 'ธีม' }));
    expect(storedSettings().favoriteToolKeys).toEqual([
      'fontSize',
      'lineHeight',
      'width',
      'bookmark',
      'search',
      'notes',
    ]);

    // Close the settings picker, then ⋯ toggles Level 2 closed (T15 v2.3 —
    // the ย้อนกลับ back button is gone) → Level 1 no longer has ธีม.
    // T25: with the animation gate on (this file's matchMedia stub reports
    // NO reduced-motion preference) the L2 close plays a 140ms pop-out +
    // 200ms hold — flush it before asserting the settled state.
    fireEvent.keyDown(document, { key: 'Escape' }); // picker
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' })); // L2 → L1
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    expect(screen.queryByRole('button', { name: /ธีม/ })).toBeNull();
    // …but Level 2 row 2 still offers it (row 2 = everything not pinned).
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' })); // ⋯ reopens L2
    expect(screen.getByRole('button', { name: /ธีม/ })).toBeTruthy();
  });

  it('pin บทนิยาม → Level 1 gains the glossary icon (row-2 dedup keeps it off row 1 twice)', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('switch', { name: 'บทนิยาม' }));

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' })); // ⋯ toggles L2 closed
    // T25: flush the L2 exit hold (animation gate on — see the unpin test)
    // so the unscoped query cannot match the closing L2 panel's copy.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    expect(screen.getByRole('button', { name: 'บทนิยาม' })).toBeTruthy();

    // Row 2 dedups: บทนิยาม lives in row 1 only — the L2 sibling panel
    // shows ONE instance (scoped: L1 renders SIMULTANEOUSLY now, so the
    // unscoped getAllByRole would count the L1 button too — T15 v2.3).
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' })); // ⋯ reopens L2
    const more = document.getElementById('lawlib-more-panel');
    expect(more).not.toBeNull();
    expect(within(more as HTMLElement).getAllByRole('button', { name: 'บทนิยาม' }).length).toBe(1);
  });

  it('per-setting คืนค่า restores the curated favorites', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('switch', { name: 'ธีม' }));
    fireEvent.click(within(picker).getByRole('switch', { name: 'บทนิยาม' }));
    expect(storedSettings().favoriteToolKeys).not.toEqual(DEFAULT_FAVORITE_KEYS_EXPECTED);

    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าเครื่องมือแถวลัด' }));
    expect(storedSettings().favoriteToolKeys).toEqual(DEFAULT_FAVORITE_KEYS_EXPECTED);
  });
});

describe('T23 settings panel — auto-scroll speed display (ระดับ N · X.X วิ/บรรทัด)', () => {
  it('slider label shows ระดับ {n} · {x.x} วิ/บรรทัด at speed > 0 (default 16px × 1.8)', async () => {
    await renderReader();
    const picker = await openSettings();
    const slider = within(picker).getByLabelText('ความเร็ว') as HTMLInputElement;

    // Off → ปิด (aria-valuetext mirrors the visible label; scoped to the
    // slider — the T42 motion picker adds its own ปิด option button).
    expect(slider.getAttribute('aria-valuetext')).toBe('ปิด');

    // Speed 1 @ 16×1.8 → 28.8/48 = 0.6 s/line.
    fireEvent.change(slider, { target: { value: '1' } });
    expect(within(picker).getByText('ระดับ 1 · 0.6 วิ/บรรทัด')).toBeTruthy();
    expect(slider.getAttribute('aria-valuetext')).toBe('ระดับ 1 · 0.6 วิ/บรรทัด');

    // Speed 3 → 28.8/144 = 0.2.
    fireEvent.change(slider, { target: { value: '3' } });
    expect(within(picker).getByText('ระดับ 3 · 0.2 วิ/บรรทัด')).toBeTruthy();

    // Speed 5 → 28.8/240 = 0.12 → 0.1 (1 decimal).
    fireEvent.change(slider, { target: { value: '5' } });
    expect(within(picker).getByText('ระดับ 5 · 0.1 วิ/บรรทัด')).toBeTruthy();
  });

  it('reduced-motion renders ปิด even with a stored speed (forced-off value)', async () => {
    mockMatchMedia([['(prefers-reduced-motion: reduce)', true]]);
    localStorage.setItem('lawlib:settings', JSON.stringify({ autoScrollSpeed: 3 }));
    await renderReader();
    const picker = await openSettings();
    const slider = within(picker).getByLabelText('ความเร็ว') as HTMLInputElement;
    // The stored 3 survives (validator) but the slider + label render OFF.
    expect(storedSettings().autoScrollSpeed).toBe(3);
    expect(slider.value).toBe('0');
    expect(slider.getAttribute('aria-valuetext')).toBe('ปิด');
  });
});

describe('T23 settings panel — 5 reading-surface sections (both mounts, same state)', () => {
  it('renders Theme / Paper tone / Text size / Line spacing / Width sections', async () => {
    await renderReader();
    const picker = await openSettings();
    expect(within(picker).getByRole('heading', { name: 'ธีม' })).toBeTruthy();
    expect(within(picker).getByRole('heading', { name: 'ความเหลืองของกระดาษ' })).toBeTruthy();
    expect(within(picker).getByRole('heading', { name: 'ขนาดตัวอักษร' })).toBeTruthy();
    expect(within(picker).getByRole('heading', { name: 'ความสูงบรรทัด' })).toBeTruthy();
    expect(within(picker).getByRole('heading', { name: 'ความกว้างเนื้อหา' })).toBeTruthy();

    // The controls themselves: 4 theme modes + stepper + sliders.
    for (const label of ['ธีมสว่าง', 'ธีมมืด', 'ธีมกระดาษ', 'ธีมซีเปีย']) {
      expect(within(picker).getByRole('button', { name: label })).toBeTruthy();
    }
    expect(within(picker).getByRole('button', { name: 'ตัวอักษรใหญ่ขึ้น' })).toBeTruthy();
    expect(within(picker).getByRole('slider', { name: 'ความสูงบรรทัด' })).toBeTruthy();
    expect(within(picker).getByRole('slider', { name: 'ความกว้างเนื้อหา' })).toBeTruthy();
    expect(within(picker).getByRole('slider', { name: 'ความเหลืองของกระดาษ' })).toBeTruthy();
  });

  it('text size / line spacing / width changes in ⚙️ reflect on the L1 pickers (same settings state)', async () => {
    await renderReader();
    const picker = await openSettings();

    // Text size stepper + → 17px (persisted + L1 button label).
    fireEvent.click(within(picker).getByRole('button', { name: 'ตัวอักษรใหญ่ขึ้น' }));
    expect(storedSettings().fontSize).toBe(17);
    expect(screen.getByRole('button', { name: 'ตัวอักษร 17px' })).toBeTruthy();

    // Line spacing slider → 1.2.
    fireEvent.change(within(picker).getByRole('slider', { name: 'ความสูงบรรทัด' }), {
      target: { value: '1.2' },
    });
    expect(storedSettings().lineHeight).toBe(1.2);
    expect(screen.getByRole('button', { name: 'บรรทัด 1.2' })).toBeTruthy();

    // Width slider → 110%.
    fireEvent.change(within(picker).getByRole('slider', { name: 'ความกว้างเนื้อหา' }), {
      target: { value: '110' },
    });
    expect(storedSettings().width).toBe(110);
    expect(screen.getByRole('button', { name: 'กว้าง 110%' })).toBeTruthy();
  });

  it('theme + paper tone in ⚙️ share the ThemeProvider state with the L1 theme picker', async () => {
    await renderReader();
    const picker = await openSettings();

    // Theme → ซีเปีย: html class + the L1 theme button mirrors it (icon +
    // accessible name — the SAME ThemeProvider state both mounts read).
    fireEvent.click(within(picker).getByRole('button', { name: 'ธีมซีเปีย' }));
    expect(document.documentElement.classList.contains('sepia')).toBe(true);
    const l1Theme = screen.getByRole('button', { name: 'ธีม ซีเปีย' });
    expect(l1Theme.querySelector('.fi-sr-palette')).not.toBeNull();

    // Paper tone in ⚙️ → persisted under lawlib:paperTone.
    const paperSlider = within(picker).getByRole('slider', { name: 'ความเหลืองของกระดาษ' });
    fireEvent.change(paperSlider, { target: { value: '80' } });
    expect(localStorage.getItem('lawlib:paperTone')).toBe('80');

    // The L1 theme picker shows the SAME tone (both mounts write the same
    // key through the same ThemeProvider.setPaperTone).
    fireEvent.keyDown(document, { key: 'Escape' }); // close ⚙️ picker
    fireEvent.click(l1Theme); // open the L1 theme picker (sepia → slider)
    const l1Paper = screen.getByRole('slider', { name: 'ความเหลืองของกระดาษ' });
    expect((l1Paper as HTMLInputElement).value).toBe('80');
  });

  it('the 5 sections carry per-setting คืนค่า resets (disabled at defaults)', async () => {
    await renderReader();
    const picker = await openSettings();
    // Theme has no reset (site-wide preference — out of the settings
    // contract); paper tone resets to DEFAULT_PAPER_TONE 50.
    expect(
      (
        within(picker).getByRole('button', {
          name: 'คืนค่าความเหลืองของกระดาษ',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (within(picker).getByRole('button', { name: 'คืนค่าขนาดตัวอักษร' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (within(picker).getByRole('button', { name: 'คืนค่าความสูงบรรทัด' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (within(picker).getByRole('button', { name: 'คืนค่าความกว้างเนื้อหา' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    // A change enables only that section's reset.
    fireEvent.click(within(picker).getByRole('button', { name: 'ตัวอักษรใหญ่ขึ้น' }));
    expect(storedSettings().fontSize).toBe(17);
    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าขนาดตัวอักษร' }));
    expect(storedSettings().fontSize).toBe(16);
  });
});

describe('T29 settings/picker popovers — pop-in, stagger, pop-out (ADR-023 D9/D10)', () => {
  it('open: lawlib-pop-in 300ms (locked duration override) + vt-picker + origin at the trigger', async () => {
    await renderReader();
    const picker = await openSettings();
    // AC-4: the VT helper class (unique view-transition-name, T27 inventory).
    expect(picker.classList.contains('vt-picker')).toBe(true);
    expect(picker.classList.contains('lawlib-picker')).toBe(true);
    // Entry = pop-in with the D9 300ms override (class default is 200ms —
    // D10 "animation-duration after the shorthand").
    expect(picker.classList.contains('lawlib-pop-in')).toBe(true);
    expect(picker.classList.contains('lawlib-pop-out')).toBe(false);
    // T42 (ADR-025 D2): the inline duration rides --motion-factor
    // (quality 300ms; fast 150ms; disable/RM kill → instant).
    expect(picker.style.animationDuration).toBe('calc(300ms * var(--motion-factor, 1))');
    // D10 origin per trigger: the layout effect sets a px origin from the
    // anchor rect. jsdom rects are all 0 → the anchor center clamps to the
    // popover's top-left corner; the assertion pins that the effect ran.
    expect(picker.style.transformOrigin).toBe('0px 0px');
  });

  it('open: the surface RISES via its own lawlib-fade-rise (nested wrapper — one animation per element)', async () => {
    await renderReader();
    const picker = await openSettings();
    // D10: the OUTER pops, the INNER (surface) rises — no single element
    // carries both animations.
    const surface = picker.firstElementChild as HTMLElement;
    expect(surface.classList.contains('lawlib-fade-rise')).toBe(true);
    expect(surface.classList.contains('lawlib-pop-in')).toBe(false);
    expect(surface.style.animationDuration).toBe('');
  });

  it('T54: the 3 group wrappers stagger in 40ms steps (inline animation-delay)', async () => {
    await renderReader();
    const picker = await openSettings();
    const rising = Array.from(picker.querySelectorAll<HTMLElement>('div')).filter((el) =>
      el.classList.contains('lawlib-fade-rise'),
    );
    // The surface wrapper + the 3 group wrappers (document order) — the old
    // per-section stagger wrappers are GONE (ADR-026 W6 / T54 AC-4: folded
    // into the group wrappers; D10 one animation per element).
    expect(rising.length).toBe(4);
    expect(rising.slice(1).map((el) => el.style.animationDelay)).toEqual([
      '0ms',
      'calc(40ms * var(--motion-factor, 1))',
      'calc(80ms * var(--motion-factor, 1))',
    ]);
  });

  it('close (outside click): mirrored pop-out 200ms + delay-unmount, then unmounts', async () => {
    await renderReader();
    await openSettings();
    fireEvent.pointerDown(document.body);
    // The exit window: still mounted, playing the mirrored pop-out.
    const closingEl = screen.getByRole('group', { name: 'ตั้งค่า' }) as HTMLElement;
    expect(closingEl.classList.contains('lawlib-pop-out')).toBe(true);
    expect(closingEl.classList.contains('lawlib-pop-in')).toBe(false);
    expect(closingEl.style.animationDuration).toBe('calc(200ms * var(--motion-factor, 1))');
    // The 200ms hold elapses → the popover unmounts.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    expect(screen.queryByRole('group', { name: 'ตั้งค่า' })).toBeNull();
  });

  it('reduced-motion: outside click closes INSTANTLY — no exit hold (AC-5)', async () => {
    mockMatchMedia([['(prefers-reduced-motion: reduce)', true]]);
    await renderReader();
    await openSettings();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('group', { name: 'ตั้งค่า' })).toBeNull();
  });

  it('T42 disable tier: outside click closes INSTANTLY — no exit hold (tier kill)', async () => {
    document.documentElement.dataset.motion = 'disable';
    await renderReader();
    await openSettings();
    fireEvent.pointerDown(document.body);
    // The tier kill zeroes the exit animation — a JS hold would only linger
    // on an invisible popover, so onClose must fire immediately.
    expect(screen.queryByRole('group', { name: 'ตั้งค่า' })).toBeNull();
  });

  it('T42 fast tier: outside click hold HALVED (100ms) — unmounts inside the 200ms window', async () => {
    document.documentElement.dataset.motion = 'fast';
    await renderReader();
    await openSettings();
    fireEvent.pointerDown(document.body);
    // Still held — the mirrored pop-out plays (fast tier animates at 0.5×).
    const closingEl = screen.getByRole('group', { name: 'ตั้งค่า' }) as HTMLElement;
    expect(closingEl.classList.contains('lawlib-pop-out')).toBe(true);
    expect(closingEl.classList.contains('lawlib-pop-in')).toBe(false);
    // 100ms halved hold → unmounts well before the 200ms full window.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    expect(screen.queryByRole('group', { name: 'ตั้งค่า' })).toBeNull();
  });

  it('Esc closes INSTANTLY — keyboard skip (T28 parity; the dock pre-empts the exit hold)', async () => {
    await renderReader();
    await openSettings();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'ตั้งค่า' })).toBeNull();
    // No ghost after the exit window would have elapsed.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    expect(screen.queryByRole('group', { name: 'ตั้งค่า' })).toBeNull();
  });

  it('re-open during the exit window cancels the pending unmount — the fresh picker stays (ADR-023 D4)', async () => {
    await renderReader();
    await openSettings();
    fireEvent.pointerDown(document.body); // ⚙️ starts its 200ms exit hold
    expect(
      (screen.getByRole('group', { name: 'ตั้งค่า' }) as HTMLElement).classList.contains(
        'lawlib-pop-out',
      ),
    ).toBe(true);

    // Open the L1 theme picker within the hold — the dock reuses the same
    // PickerPopover instance with a NEW anchor; the stale exit timer must
    // be cancelled or it would unmount the fresh picker.
    fireEvent.click(screen.getByRole('button', { name: 'ธีม สว่าง' }));
    const themePicker = screen.getByRole('group', { name: 'ธีม' }) as HTMLElement;
    expect(themePicker.classList.contains('lawlib-pop-in')).toBe(true);
    expect(themePicker.style.animationDuration).toBe('calc(300ms * var(--motion-factor, 1))');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    expect(screen.getByRole('group', { name: 'ธีม' })).toBeTruthy();
  });
});

describe('T42 settings panel — motion preference picker (ADR-025 D2)', () => {
  it('renders การเคลื่อนไหว: ปิด / เร็ว / ปกติ in order; ปกติ pressed at the default', async () => {
    await renderReader();
    const picker = await openSettings();
    expect(within(picker).getByRole('heading', { name: 'การเคลื่อนไหว' })).toBeTruthy();
    const options = within(picker).getAllByRole('button', { name: /^การเคลื่อนไหว/ });
    expect(options.map((b) => b.textContent)).toEqual(['ปิด', 'เร็ว', 'ปกติ']);
    expect(options[2].getAttribute('aria-pressed')).toBe('true');
    // The per-setting คืนค่า is disabled at the default ('quality').
    expect(
      (within(picker).getByRole('button', { name: 'คืนค่าการเคลื่อนไหว' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('selecting เร็ว / ปิด persists through the shared validator', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('button', { name: 'การเคลื่อนไหวเร็ว' }));
    expect(storedSettings().motionPreference).toBe('fast');
    expect(
      within(picker)
        .getByRole('button', { name: 'การเคลื่อนไหวเร็ว' })
        .getAttribute('aria-pressed'),
    ).toBe('true');

    fireEvent.click(within(picker).getByRole('button', { name: 'การเคลื่อนไหวปิด' }));
    expect(storedSettings().motionPreference).toBe('disable');
    expect(
      within(picker).getByRole('button', { name: 'การเคลื่อนไหวปิด' }).getAttribute('aria-pressed'),
    ).toBe('true');

    // Per-setting คืนค่า → back to the default 'quality'.
    fireEvent.click(within(picker).getByRole('button', { name: 'คืนค่าการเคลื่อนไหว' }));
    expect(storedSettings().motionPreference).toBe('quality');
    expect(
      within(picker)
        .getByRole('button', { name: 'การเคลื่อนไหวปกติ' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('under OS reduced-motion: ปกติ DISABLED (greyed) + hint; stored quality shows as เร็ว (effective)', async () => {
    mockMatchMedia([['(prefers-reduced-motion: reduce)', true]]);
    localStorage.setItem('lawlib:settings', JSON.stringify({ motionPreference: 'quality' }));
    await renderReader();
    const picker = await openSettings();

    // Quality is visible but NOT selectable (user-locked Q1).
    const qualityBtn = within(picker).getByRole('button', {
      name: 'การเคลื่อนไหวปกติ',
    }) as HTMLButtonElement;
    expect(qualityBtn.disabled).toBe(true);
    // Selected = the EFFECTIVE tier: quality downgrades to fast under RM.
    expect(
      within(picker)
        .getByRole('button', { name: 'การเคลื่อนไหวเร็ว' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    // The hint explains the lockdown.
    expect(
      within(picker).getByText('ระบบลดการเคลื่อนไหวเปิดอยู่ — เลือกได้ เร็ว หรือ ปิด'),
    ).toBeTruthy();
  });

  it('under OS reduced-motion: stored fast stays fast (no downgrade)', async () => {
    mockMatchMedia([['(prefers-reduced-motion: reduce)', true]]);
    localStorage.setItem('lawlib:settings', JSON.stringify({ motionPreference: 'fast' }));
    await renderReader();
    const picker = await openSettings();
    expect(
      within(picker)
        .getByRole('button', { name: 'การเคลื่อนไหวเร็ว' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('under OS reduced-motion: stored disable stays disable (no downgrade)', async () => {
    mockMatchMedia([['(prefers-reduced-motion: reduce)', true]]);
    localStorage.setItem('lawlib:settings', JSON.stringify({ motionPreference: 'disable' }));
    await renderReader();
    const picker = await openSettings();
    expect(
      within(picker).getByRole('button', { name: 'การเคลื่อนไหวปิด' }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      (within(picker).getByRole('button', { name: 'การเคลื่อนไหวปกติ' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
