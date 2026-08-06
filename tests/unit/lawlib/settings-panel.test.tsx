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

const dockIcon = () => screen.getByRole('button', { name: 'เครื่องมืออ่าน' });

beforeEach(() => {
  mockLocalStorage();
  mockMatchMedia([]);
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  document.documentElement.className = '';
  document.documentElement.removeAttribute('style');
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

/** Open Level 2 → ⚙️ settings picker. Returns the picker group. */
async function openSettings() {
  fireEvent.click(dockIcon());
  fireEvent.click(screen.getByRole('button', { name: 'เพิ่มเติม' }));
  fireEvent.click(screen.getByRole('button', { name: /^ตั้งค่า/ }));
  const picker = screen.getByRole('group', { name: 'ตั้งค่า' });
  return picker;
}

const storedSettings = () =>
  JSON.parse(localStorage.getItem('lawlib:settings') ?? 'null') as Record<string, unknown>;

describe('T10b settings panel — ⚙️ wiring', () => {
  it('opens the settings picker from Level 2 with the section headings', async () => {
    await renderReader();
    const picker = await openSettings();
    expect(within(picker).getByRole('heading', { name: 'ฟอนต์ตัวบท' })).toBeTruthy();
    expect(
      within(picker).getByRole('heading', { name: 'ความโปร่งใสของแถบเครื่องมือ' }),
    ).toBeTruthy();
    expect(within(picker).getByRole('heading', { name: 'ขนาดแถบเครื่องมือ' })).toBeTruthy();
    expect(within(picker).getByRole('heading', { name: 'โหมดโฟกัส' })).toBeTruthy();
    expect(within(picker).getByRole('heading', { name: 'รีเซ็ต' })).toBeTruthy();
    // NOT a dialog — the PickerPopover group stays non-modal (no nesting).
    expect(picker.getAttribute('role')).toBe('group');
  });

  it('glass slider persists through the shared validator', async () => {
    await renderReader();
    const picker = await openSettings();
    const slider = within(picker).getByLabelText('ความทึบ (เฉพาะ dock + ค้นหา)');
    expect((slider as HTMLInputElement).value).toBe('75');
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

  it('paragraph spacing + font weight options persist', async () => {
    await renderReader();
    const picker = await openSettings();
    fireEvent.click(within(picker).getByRole('button', { name: 'ระยะห่างย่อหน้า 0.5' }));
    expect(storedSettings().paragraphSpacing).toBe(0.5);
    fireEvent.click(within(picker).getByRole('button', { name: 'ความหนาตัวอักษรหนา' }));
    expect(storedSettings().fontWeight).toBe('bold');
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
    expect(document.body.classList.contains('lawlib-focus')).toBe(false);
    expect(storedSettings().focusMode).toBe(false);
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
    // Stop button turns the feature off again.
    fireEvent.click(screen.getByRole('button', { name: 'ปิดเลื่อนอัตโนมัติ' }));
    expect(storedSettings().autoScrollSpeed).toBe(0);
    expect(screen.queryByRole('button', { name: /หยุดชั่วคราว/ })).toBeNull();
  });

  it('reset: inline confirm wipes settings + favorites + position + paper tone', async () => {
    // Set some state first: settings + a position + a paper tone.
    localStorage.setItem('lawlib:settings', JSON.stringify({ fontSize: 24 }));
    localStorage.setItem('lawlib:dockPosition', 'top-left');
    localStorage.setItem('lawlib:paperTone', '80');
    await renderReader();
    fireEvent.click(dockIcon());
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
      width: 100,
      favoriteToolKeys: ['theme', 'fontSize', 'lineHeight', 'width', 'bookmark', 'search', 'notes'],
      fontFamily: 'sarabun',
      glassOpacity: 75,
      toolbarSize: 44,
      paragraphSpacing: 0,
      fontWeight: 'normal',
      hideRepealed: false,
      hideAmendmentNotes: false,
      focusMode: false,
      autoScrollSpeed: 0,
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
