// @vitest-environment jsdom
/**
 * T30 (ADR-023 D9 rows 4/15/19 — drawers + search stagger + auto-scroll chip)
 * motion contract tests, exercised THROUGH the full reader client:
 * `<ThemeProvider><LawlibReaderClient law={sampleLaw} digestView={null} /></ThemeProvider>`
 * (module-local wiring precedent — same harness as reading-dock.test.tsx).
 *
 * Pinned here:
 * - AC-1 drawer OPEN: overlay `lawlib-overlay-fade` (bg-black/10, NO
 *   backdrop-blur per UI rule) + panel `lawlib-slide-left` + `vt-drawer`;
 *   content stagger 40ms (header 0ms → content 40ms, T29 pattern)
 * - AC-1 drawer CLOSE paths: Esc = INSTANT unmount · overlay click / X =
 *   animated (panelClosing hold 400ms → mirrored reverse exit → unmount) ·
 *   re-open during the hold cancels the pending exit (stale-timer guard —
 *   the re-opened drawer must never be ghost-unmounted)
 * - AC-4 reduced-motion: the hold is skipped (JS gate) — instant unmount
 * - AC-2 search stagger (flicker trap): the FIRST results `ul` of a search
 *   session gets `lawlib-stagger`; it is STRIPPED after
 *   SEARCH_STAGGER_STRIP_MS; live keystroke re-filters NEVER re-add it; a
 *   fresh panel session re-arms (per-session by construction)
 * - AC-3/AC-5 chip: mounts with `lawlib-fade-rise` 150ms + `vt-chip` (NO pop
 *   on first mount — entry is fade only); speed CHANGE re-triggers
 *   `lawlib-chip-pop` (timer-cleared — onAnimationEnd is unreliable in
 *   throttled tabs and unsynthesizable in jsdom); stop (speed → 0) holds
 *   the chip for the 150ms exit; RM → chip never renders
 *
 * jsdom gaps stubbed: matchMedia (query-aware: dark/mobile/reduced-motion),
 * IntersectionObserver (TocSidebar scroll-spy), localStorage (in-memory
 * store). The auto-scroll rAF chain is stubbed in the chip suite so the
 * loop can neither crash (no rAF in jsdom) nor reach a natural end and
 * stop the chip mid-assertion. Timers are REAL (reading-dock convention);
 * holds are waited out with `act` + setTimeout.
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
 * reduced-motion ON (motion tests flip it OFF per-test).
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

// --- T30 selectors ----------------------------------------------------------
const drawer = () => document.querySelector('.vt-drawer') as HTMLElement | null;
const drawerAside = () => drawer()?.querySelector('aside[role="dialog"]') as HTMLElement | null;
const drawerOverlay = () => drawer()?.querySelector('.lawlib-overlay-fade') as HTMLElement | null;
const searchTool = () => screen.getByRole('button', { name: 'ค้นหามาตรา' });
const notesTool = () => screen.getByRole('button', { name: 'บันทึกของฉัน' });
const drawerClose = () => screen.getByRole('button', { name: 'ปิด' });
const moreBtn = () => screen.getByRole('button', { name: 'เพิ่มเติม' });
const morePanel = () => document.getElementById('lawlib-more-panel');
const autoScrollTool = () =>
  within(morePanel() as HTMLElement).getByRole('button', { name: 'อ่านอัตโนมัติ' });
const chip = () => document.querySelector('.lawlib-autoscroll-chip') as HTMLElement | null;
const chipPill = () => chip()?.firstElementChild as HTMLElement | null;

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

/** Advance real timers inside act (reading-dock hold-wait convention). */
async function wait(ms: number) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

describe('T30 — drawer motion (AC-1/AC-4/AC-5)', () => {
  it('open: overlay fade (no blur) + slide-left + vt-drawer + 40ms content stagger', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(searchTool());

    expect(drawer()).not.toBeNull();
    expect(drawer()!.className).toContain('vt-drawer');
    // Overlay: plain bg-black/10 fade — NO backdrop-blur (UI rule).
    expect(drawerOverlay()).not.toBeNull();
    expect(drawerOverlay()!.className).toContain('lawlib-overlay-fade');
    expect(drawerOverlay()!.className).toContain('bg-black/10');
    expect(drawerOverlay()!.className).not.toContain('backdrop-blur');
    expect(drawerOverlay()!.style.animationDirection).toBe('normal');
    // Panel: slides in from the right edge (lawlib-slide-left = translateX
    // 100%→0) at 400ms — the enter direction, NOT closing.
    expect(drawerAside()).not.toBeNull();
    expect(drawerAside()!.className).toContain('lawlib-slide-left');
    expect(drawerAside()!.style.animationDirection).toBe('normal');
    // Content stagger 40ms (T29 pattern): header fade-rise 0ms → content 40ms.
    const header = drawerAside()!.querySelector('header') as HTMLElement;
    const content = header.nextElementSibling as HTMLElement;
    expect(header.className).toContain('lawlib-fade-rise');
    expect(content.className).toContain('lawlib-fade-rise');
    expect(content.style.animationDelay).toBe('40ms');
  });

  it('Esc closes INSTANT — no exit hold, even with motion enabled', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(searchTool());
    expect(drawer()).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(drawer()).toBeNull();
  });

  it('X button closes ANIMATED: reverse direction + 400ms hold, then unmounts', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(searchTool());
    fireEvent.click(drawerClose());

    // Held for the exit animation — mirrored slide-out + overlay fade.
    expect(drawer()).not.toBeNull();
    expect(drawerAside()!.style.animationDirection).toBe('reverse');
    expect(drawerOverlay()!.style.animationDirection).toBe('reverse');

    // The 400ms hold completes → delay-unmount.
    await wait(450);
    expect(drawer()).toBeNull();
  });

  it('overlay click closes ANIMATED (same hold path as the X button)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(searchTool());
    fireEvent.click(drawerOverlay()!);

    expect(drawer()).not.toBeNull();
    expect(drawerAside()!.style.animationDirection).toBe('reverse');

    await wait(450);
    expect(drawer()).toBeNull();
  });

  it('AC-4: reduced-motion skips the hold — X closes instantly', async () => {
    // Test default: reducedMotion stub ON.
    await renderReader();

    fireEvent.click(searchTool());
    fireEvent.click(drawerClose());

    expect(drawer()).toBeNull();
  });

  it('re-open DURING the exit hold cancels the pending unmount (stale-timer guard)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(searchTool());
    fireEvent.click(drawerClose());
    expect(drawerAside()!.style.animationDirection).toBe('reverse');

    // Re-open a DIFFERENT panel inside the 400ms window — the pending exit
    // timer must be cancelled (a stale timer would ghost-unmount the drawer).
    fireEvent.click(notesTool());
    await wait(450); // ≥ the full hold window

    expect(drawer()).not.toBeNull();
    expect(drawerAside()!.style.animationDirection).toBe('normal');

    // The re-opened drawer closes normally afterwards.
    fireEvent.click(drawerClose());
    await wait(450);
    expect(drawer()).toBeNull();
  });
});

describe('T30 — search stagger, session-gated (AC-2 flicker trap)', () => {
  it('FIRST results stagger; strip after 800ms; keystrokes never re-add; reopen re-arms', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(searchTool());
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'การศึกษา' } });

    // Debounce (180ms) → first results render → the observer stages them.
    await wait(300);
    const ul = drawer()!.querySelector('ul') as HTMLElement;
    expect(ul).not.toBeNull();
    expect(ul.children.length).toBeGreaterThanOrEqual(2);
    expect(ul.className).toContain('lawlib-stagger');

    // The stagger completes at 420ms + 300ms anim — stripped at 800ms.
    await wait(850);
    expect(ul.className).not.toContain('lawlib-stagger');

    // Live keystroke re-filter (different query, still matching): the
    // session-gate is spent — the class must NOT come back.
    fireEvent.change(input, { target: { value: 'สถานศึกษา' } });
    await wait(300);
    const ul2 = drawer()!.querySelector('ul') as HTMLElement;
    expect(ul2).not.toBeNull();
    expect(ul2.className).not.toContain('lawlib-stagger');

    // A NEW panel session re-arms the gate: close (Esc = instant) and
    // re-open — first results of the new session stagger again.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(drawer()).toBeNull();

    fireEvent.click(searchTool());
    const input2 = screen.getByRole('searchbox');
    fireEvent.change(input2, { target: { value: 'การศึกษา' } });
    await wait(300);
    const ul3 = drawer()!.querySelector('ul') as HTMLElement;
    expect(ul3).not.toBeNull();
    expect(ul3.className).toContain('lawlib-stagger');
  });
});

describe('T30 — auto-scroll chip (AC-3/AC-4/AC-5)', () => {
  beforeEach(() => {
    // jsdom has no rAF; the auto-scroll loop must neither crash nor reach a
    // natural end (which would stop the chip mid-assertion).
    vi.stubGlobal('requestAnimationFrame', () => 0);
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  it('appears on auto-scroll start: fade-rise + vt-chip, NO pop on first mount', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(moreBtn());
    fireEvent.click(autoScrollTool());

    expect(chip()).not.toBeNull();
    expect(chip()!.className).toContain('lawlib-autoscroll-chip');
    expect(chip()!.className).toContain('lawlib-fade-rise');
    expect(chip()!.className).toContain('vt-chip');
    expect(chip()!.style.animationDirection).toBe('normal');
    // Entry = fade-rise only; the level-pop is for CHANGES (AC-3).
    expect(chipPill()!.className).not.toContain('lawlib-chip-pop');
  });

  it('stop (speed → 0) holds the chip for the 150ms exit, then unmounts', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(moreBtn());
    fireEvent.click(autoScrollTool());
    expect(chip()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'ปิดเลื่อนอัตโนมัติ' }));
    await wait(20); // the closing state flips inside a transition

    // Held for the reversed 150ms fade.
    expect(chip()).not.toBeNull();
    expect(chip()!.style.animationDirection).toBe('reverse');

    await wait(200);
    expect(chip()).toBeNull();
  });

  it('speed CHANGE while live re-triggers lawlib-chip-pop (timer-cleared)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(moreBtn());
    fireEvent.click(autoScrollTool());
    expect(chip()).not.toBeNull();

    // Change the level via the settings picker slider (ความเร็ว 3 → 5).
    fireEvent.click(screen.getByRole('button', { name: /^ตั้งค่า/ }));
    const picker = screen.getByRole('group', { name: 'ตั้งค่า' });
    const slider = within(picker).getByRole('slider', { name: 'ความเร็ว' });
    fireEvent.change(slider, { target: { value: '5' } });
    await wait(20); // the pop flag flips inside a transition

    expect(chipPill()!.className).toContain('lawlib-chip-pop');

    // One-shot: the clear timer (CHIP_ANIM_MS) removes the class so the
    // NEXT change can replay the pop.
    await wait(200);
    expect(chipPill()!.className).not.toContain('lawlib-chip-pop');
  });

  it('AC-4: reduced-motion → the chip never renders (speed value preserved)', async () => {
    // Test default: reducedMotion stub ON.
    await renderReader();

    fireEvent.click(moreBtn());
    fireEvent.click(autoScrollTool());

    expect(chip()).toBeNull();
  });
});
