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
 *   SEARCH_STAGGER_STRIP_MS — and IMMEDIATELY on a post-staging re-filter
 *   (observer microtask, pre-paint: new nodes never re-animate even
 *   within the window); live keystroke re-filters NEVER re-add it; a
 *   fresh panel session re-arms (per-session by construction)
 * - T31 focus mode (AC-2): ENTER hides the chrome at t=0 and the reading
 *   surface fades IN (keyframe REVERSED), animation cleared at 500ms;
 *   EXIT fades the surface OUT (forward), THEN the chrome returns;
 *   reduced-motion = instant toggle both ways
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
import { parseDigestMd } from '@/lib/lawlib/parser';
import { buildView, type DigestView } from '@/lib/lawlib/digest-view';
import { glossaryIndex } from '@/lib/lawlib-reader';

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
  document.documentElement.removeAttribute('data-motion');
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
    // T42 (ADR-025 D2): the inline delay rides --motion-factor (40ms × 1).
    expect(content.style.animationDelay).toBe('calc(40ms * var(--motion-factor, 1))');
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

  it('T42 disable tier: X closes INSTANTLY — no 400ms hold (tier kill)', async () => {
    mockMatchMedia({ reducedMotion: false });
    document.documentElement.dataset.motion = 'disable';
    await renderReader();

    fireEvent.click(searchTool());
    fireEvent.click(drawerClose());

    // The tier kill zeroes the exit animation — the JS hold would only
    // linger on an invisible drawer, so it must be skipped entirely.
    expect(drawer()).toBeNull();
  });

  it('T42 fast tier: X close hold HALVED (200ms) — unmounts inside the 400ms window', async () => {
    mockMatchMedia({ reducedMotion: false });
    document.documentElement.dataset.motion = 'fast';
    await renderReader();

    fireEvent.click(searchTool());
    fireEvent.click(drawerClose());

    // Still held — the mirrored slide-out + overlay fade play (0.5×).
    expect(drawer()).not.toBeNull();
    expect(drawerAside()!.style.animationDirection).toBe('reverse');
    expect(drawerOverlay()!.style.animationDirection).toBe('reverse');

    // 200ms halved hold → unmounts well before the 400ms full window.
    await wait(250);
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

  it('keystroke re-filter WITHIN the 800ms window strips the stagger IMMEDIATELY (new nodes never re-animate)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(searchTool());
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'การศึกษา' } });

    // Debounce (180ms) → first results render → the observer stages them.
    await wait(300);
    const ul = drawer()!.querySelector('ul') as HTMLElement;
    expect(ul).not.toBeNull();
    expect(ul.className).toContain('lawlib-stagger');

    // Re-filter while the strip timer is still pending (< 800ms): the
    // debounced results re-render mutates the list → the observer strips
    // the class in the SAME microtask (before paint), so the newly
    // inserted nodes never play the stagger.
    fireEvent.change(input, { target: { value: 'สถานศึกษา' } });
    await wait(300);
    expect(ul.className).not.toContain('lawlib-stagger');

    // The session gate is spent: a further re-filter must not re-add.
    fireEvent.change(input, { target: { value: 'การ' } });
    await wait(300);
    const ul2 = drawer()!.querySelector('ul') as HTMLElement;
    expect(ul2).not.toBeNull();
    expect(ul2.className).not.toContain('lawlib-stagger');
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

  it('T42 disable tier: stop (speed → 0) closes INSTANTLY — no 150ms hold', async () => {
    mockMatchMedia({ reducedMotion: false });
    document.documentElement.dataset.motion = 'disable';
    await renderReader();

    fireEvent.click(moreBtn());
    fireEvent.click(autoScrollTool());
    expect(chip()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'ปิดเลื่อนอัตโนมัติ' }));
    await wait(20); // let the transition flush

    // The tier kill zeroes the exit fade — no closing-state hold.
    expect(chip()).toBeNull();
  });

  it('T42 fast tier: stop hold HALVED (75ms) — unmounts inside the 150ms window', async () => {
    mockMatchMedia({ reducedMotion: false });
    document.documentElement.dataset.motion = 'fast';
    await renderReader();

    fireEvent.click(moreBtn());
    fireEvent.click(autoScrollTool());
    expect(chip()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'ปิดเลื่อนอัตโนมัติ' }));
    await wait(20); // the closing state flips inside a transition

    // Still held — the reversed fade plays (0.5×).
    expect(chip()).not.toBeNull();
    expect(chip()!.style.animationDirection).toBe('reverse');

    // 75ms halved hold → gone — well before the 150ms full window.
    await wait(100);
    expect(chip()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T31 (ADR-023 D9 rows 14/18 — page entrance + focus two-step, AC-2/AC-3)
// ---------------------------------------------------------------------------

describe('T31 — page entrance + section stagger (AC-3)', () => {
  it('page wrapper fades 500ms (backwards fill) + TOC/article columns stagger 60ms', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    // The page wrapper is the DIRECT child of the reader root (the root
    // itself must NOT animate — a persistent transform there would hijack
    // the fixed chrome's containing block).
    const root = document.querySelector<HTMLElement>('.mx-auto');
    const wrapper = root?.querySelector<HTMLElement>(':scope > .lawlib-fade-rise');
    expect(wrapper).not.toBeNull();
    expect(root!.className).not.toContain('lawlib-fade-rise');
    // T42 (ADR-025 D2): 500ms quality → 250ms fast via --motion-factor.
    expect(wrapper!.style.animationDuration).toBe('calc(500ms * var(--motion-factor, 1))');
    expect(wrapper!.style.animationFillMode).toBe('backwards');

    // Main sections: first (TOC column) 60ms, second (article column) 120ms
    // (the columns live inside #lawlib-reader-content, under the wrapper).
    const content = document.getElementById('lawlib-reader-content') as HTMLElement;
    const columns = content.querySelectorAll<HTMLElement>('.lawlib-fade-rise');
    expect(columns.length).toBe(2);
    expect(columns[0].style.animationDelay).toBe('calc(60ms * var(--motion-factor, 1))');
    expect(columns[0].style.animationFillMode).toBe('backwards');
    expect(columns[1].style.animationDelay).toBe('calc(120ms * var(--motion-factor, 1))');
    expect(columns[1].className).toContain('lawlib-article-card');
  });
});

describe('T31 — focus mode two-step (AC-2)', () => {
  const settingsTool = () => screen.getByRole('button', { name: /^ตั้งค่า/ });
  const focusSwitch = () => screen.getByRole('switch', { name: 'เปิดโหมดโฟกัส' });
  const surface = () => document.getElementById('lawlib-reader-content') as HTMLElement;

  it('enter: body.lawlib-focus set INSTANT, surface fades IN (reverse), animation cleared after 500ms', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(moreBtn()); // ⚙️ settings sits on the dock Level-2 row
    fireEvent.click(settingsTool());
    fireEvent.click(focusSwitch());

    // The chrome hides at t=0 — the reading surface MUST stay (globals.css
    // contract + ADR-019 D7) and fades IN over 500ms: the keyframe runs
    // REVERSED (0→1, scale 0.995→1).
    expect(document.body.classList.contains('lawlib-focus')).toBe(true);
    expect(surface().style.animation).toContain('lawlib-focus-fade');
    expect(surface().style.animation).toContain('reverse');

    // The indicator mounts at toggle time (spring-in is the CSS class).
    const indicator = document.querySelector('.lawlib-reading-indicator') as HTMLElement;
    expect(indicator).not.toBeNull();
    expect(indicator.className).toContain('lawlib-reading-indicator');

    // After the 500ms fade-in the inline animation is cleared — no
    // persistent scale on the surface (fixed popover containing block).
    await wait(520);
    expect(surface().style.animation).toBe('');
    expect(document.body.classList.contains('lawlib-focus')).toBe(true);
  });

  it('exit: surface fades OUT (forward) THEN body.lawlib-focus removed + animation cleared', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(moreBtn());
    fireEvent.click(settingsTool());
    fireEvent.click(focusSwitch());
    await wait(520); // enter completes

    fireEvent.click(screen.getByRole('button', { name: 'ออกจากโหมดโฟกัส' }));

    // The surface fades OUT first (forward 1→0) — chrome still hidden
    // while the surface is readable.
    expect(surface().style.animation).toContain('lawlib-focus-fade');
    expect(surface().style.animation).not.toContain('reverse');
    expect(document.body.classList.contains('lawlib-focus')).toBe(true);

    // After the 500ms fade-out the chrome returns + the inline animation
    // is cleared — no persistent scale on the surface.
    await wait(520);
    expect(document.body.classList.contains('lawlib-focus')).toBe(false);
    expect(surface().style.animation).toBe('');
  });

  it('reduced-motion: instant toggle BOTH ways, no surface fade (JS gate)', async () => {
    // Test default: reducedMotion stub ON.
    await renderReader();

    fireEvent.click(moreBtn());
    fireEvent.click(settingsTool());
    fireEvent.click(focusSwitch());

    expect(document.body.classList.contains('lawlib-focus')).toBe(true);
    expect(surface().style.animation).toBe('');

    // Exit is equally instant.
    fireEvent.click(screen.getByRole('button', { name: 'ออกจากโหมดโฟกัส' }));
    expect(document.body.classList.contains('lawlib-focus')).toBe(false);
    expect(surface().style.animation).toBe('');
  });

  it('Esc exits focus mode through the same two-step path', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderReader();

    fireEvent.click(moreBtn());
    fireEvent.click(settingsTool());
    fireEvent.click(focusSwitch());
    await wait(520);
    expect(document.body.classList.contains('lawlib-focus')).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });

    // Fade OUT first (forward) — chrome still hidden mid-fade.
    expect(surface().style.animation).toContain('lawlib-focus-fade');
    expect(surface().style.animation).not.toContain('reverse');
    expect(document.body.classList.contains('lawlib-focus')).toBe(true);

    await wait(520);
    expect(document.body.classList.contains('lawlib-focus')).toBe(false);
    expect(surface().style.animation).toBe('');
  });
});

// ---------------------------------------------------------------------------
// T36 (ADR-024 D3 — digest history expand/collapse height animation, both
// directions, + the restoreMemberFocus guard change, senior MAJOR-2)
// ---------------------------------------------------------------------------
// Digest fixture mirrors compact-routing.test.tsx's known-good law + md
// pairing (Track C's own copy — that file belongs to Track B, so the
// history/motion/focus pins live HERE).
// ---------------------------------------------------------------------------

const t36Law: LawDoc = {
  slug: 'reader-motion-digest-test',
  code: 'พ.ร.บ. ทดสอบ พ.ศ. 2545',
  titleTh: 'พระราชบัญญัติทดสอบ พ.ศ. 2545',
  subject: 'ทดสอบ',
  part: 'ก',
  tags: [],
  verifiedAt: '2026-08-05',
  gazetteRef: '—',
  editions: [{ no: 2, gazetteDate: '2545-01-01', effectiveDate: '2545-01-02', note: 'แก้ไข' }],
  definitions: [{ term: 'สถานศึกษา', definition: 'สถานศึกษาที่จัดการศึกษาภาคบังคับ' }],
  chapters: [
    {
      no: 1,
      title: 'บททั่วไป',
      articles: [
        { no: 5, text: [{ kind: 'text', t: 'ให้ผู้ปกครองส่งเด็กเข้าเรียนในสถานศึกษา' }] },
        { no: 6, text: [{ kind: 'text', t: 'ให้สถานศึกษาจัดการศึกษา' }] },
        { no: 7, text: [{ kind: 'text', t: 'ผู้ปกครองที่ไม่ปฏิบัติตามมาตรา 5 มีความผิด' }] },
        { no: 11, text: [{ kind: 'text', t: 'ให้จัดการศึกษาขั้นพื้นฐานแก่ผู้เรียน' }] },
        { no: 12, text: [{ kind: 'text', t: 'จัดการศึกษาเป็นพิเศษสำหรับเด็กที่มีความบกพร่อง' }] },
        { no: 13, text: [{ kind: 'text', t: 'ผู้ใดไม่อำนวยความสะดวก มีความผิด' }] },
        { no: 99, text: [{ kind: 'text', t: 'บทเฉพาะกาลของฉบับเต็ม' }] },
      ],
    },
    {
      no: null,
      title: 'บทเฉพาะกาล',
      articles: [
        { no: 70, text: [{ kind: 'text', t: 'บทเฉพาะกาลฉบับหนึ่ง' }] },
        { no: 71, text: [{ kind: 'text', t: 'บทเฉพาะกาลฉบับสอง' }] },
      ],
    },
  ],
};

const T36_DIGEST_MD = `# พจนานุกรมกฎหมาย — ทดสอบ

## 1. ข้อมูลกฎหมาย

- **ชื่อ:** พระราชบัญญัติทดสอบ พ.ศ. 2545
- **ประกาศ:** ราชกิจจานุเบกษา

## 2. ประวัติการแก้ไข

**ฉบับที่ 1 (2545):** ประกาศใช้ครั้งแรก
**ฉบับที่ 2 (2545):** แก้ไข [[มาตรา 99]]

## 3. คำนิยามสำคัญ

**มาตรา 4** : คำนิยามความหมาย

## 4. มาตราสำคัญ

**มาตรา 5** : ให้ผู้ปกครองส่งเด็กเข้าเรียนในสถานศึกษา ตาม[[มาตรา 6]]
**มาตรา 6** : ให้สถานศึกษาจัดการศึกษา
**มาตรา 7** : ผู้ปกครองที่ไม่ปฏิบัติตาม[[มาตรา 5]] มีความผิด
**มาตรา 11 - มาตรา 12** : เนื้อความรวมมาตรา 11 และ 12
**มาตรา 13** : ผู้ใดไม่อำนวยความสะดวกตาม[[มาตรา 12]] และ[[มาตรา 71]] หรือ[[มาตรา 99]] มีความผิด
### บทเฉพาะกาล
**มาตรา 70** : บทเฉพาะกาลฉบับหนึ่ง
**มาตรา 71** : บทเฉพาะกาลฉบับสอง
`;

/** Mirrors page.tsx buildDigestView (in-memory, same as compact-routing). */
function buildT36DigestView(): DigestView {
  const doc = parseDigestMd(T36_DIGEST_MD);
  return buildView(
    doc,
    new Map(),
    t36Law.chapters.map((ch) => ({
      no: ch.no,
      title: ch.title,
      articleKeys: ch.articles.map((a) => `${a.no}${a.suffix ?? ''}`),
    })),
    glossaryIndex(t36Law),
    { slug: t36Law.slug, href: `/lawlib/${t36Law.slug}` },
  );
}

const t36DigestView = buildT36DigestView();

/**
 * jsdom gaps for the digest suites (compact-routing precedents): no
 * scrollIntoView (every jump/open path calls it) and no CSS.escape (the
 * reader's data-attr selectors need it; digits-only fixture → identity).
 */
function stubDigestJsdomGaps(): void {
  Element.prototype.scrollIntoView = vi.fn();
  window.CSS = { escape: (s: string) => s } as unknown as typeof CSS;
}

async function renderDigestReader() {
  const utils = render(
    <ThemeProvider>
      <LawlibReaderClient law={t36Law} digestView={t36DigestView} />
    </ThemeProvider>,
  );
  // Mount effect defers its first-article activation into setTimeout(0).
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  return utils;
}

describe('T36 — digest history height animation (AC-1/AC-2/AC-3)', () => {
  beforeEach(() => {
    stubDigestJsdomGaps();
  });

  const historyToggle = () => screen.getByRole('button', { name: /ประวัติการแก้ไข/ });
  const historyList = () => document.getElementById('lawlib-digest-history-list');
  const historyWrapper = () => historyList()?.parentElement as HTMLElement | null;

  it('collapsed: list ALWAYS present — wrapper 0fr + list inert + no content fade', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderDigestReader();

    // Always-rendered (no conditional mount): aria-controls points at a live
    // node even while collapsed (a11y improvement — documented in the code).
    const list = historyList();
    expect(list).not.toBeNull();
    expect(historyToggle().getAttribute('aria-controls')).toBe('lawlib-digest-history-list');

    // Collapsed contract: 0fr (grid-template-rows stays animatable), the
    // id node is inert (a11y/focus-tree removal — NOT hidden), the content
    // fade is NOT running.
    expect(historyWrapper()!.style.gridTemplateRows).toBe('0fr');
    expect(historyWrapper()!.style.transition).toContain('grid-template-rows');
    expect(historyWrapper()!.style.transition).toContain('400ms');
    // jsdom keeps the raw var reference — assert the TOKEN (the value is
    // --ease-ios-out: cubic-bezier(0.22, 1, 0.36, 1) per globals.css).
    // T42: the duration token rides --motion-factor too (CSS contract pin).
    expect(historyWrapper()!.style.transition).toContain('var(--ease-ios-out)');
    expect(historyWrapper()!.style.transition).toContain('var(--motion-factor');
    expect(list!.hasAttribute('inert')).toBe(true);
    expect(list!.className).toContain('min-h-0');
    expect(list!.className).toContain('overflow-hidden');
    expect(list!.querySelector('.lawlib-fade-rise')).toBeNull();
  });

  it('open: wrapper 1fr + list focusable + content fade-rise 150ms + chevron flips', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderDigestReader();

    fireEvent.click(historyToggle());
    const list = historyList()!;
    expect(historyToggle().getAttribute('aria-expanded')).toBe('true');
    // The chevron is the SECOND <i> (first = the clock icon).
    const chevron = historyToggle().querySelectorAll('i')[1];
    expect(chevron.className).toContain('rotate-180');
    expect(historyWrapper()!.style.gridTemplateRows).toBe('1fr');
    expect(list.hasAttribute('inert')).toBe(false);

    // Content fade: the class re-adds on the SAME node (no keyed remount);
    // the light 150ms variant matches the T35 group pattern.
    // T42 (ADR-025 D2): inline durations ride --motion-factor.
    const content = list.firstElementChild as HTMLElement;
    expect(content.className).toContain('lawlib-fade-rise');
    expect(content.style.animationDuration).toBe('calc(150ms * var(--motion-factor, 1))');

    // The merged history body renders in both ฉบับ entries.
    expect(list.textContent).toContain('ฉบับที่ 1');
    expect(list.textContent).toContain('ฉบับที่ 2');
  });

  it('collapse animates BACK: 0fr + inert again on the SAME list node', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderDigestReader();

    fireEvent.click(historyToggle());
    const list = historyList()!;
    fireEvent.click(historyToggle());

    expect(historyToggle().getAttribute('aria-expanded')).toBe('false');
    expect(historyWrapper()!.style.gridTemplateRows).toBe('0fr');
    expect(historyList()).toBe(list); // node identity preserved
    expect(list.hasAttribute('inert')).toBe(true);
    expect(list.querySelector('.lawlib-fade-rise')).toBeNull();
  });

  it('AC-3: the SAME merged block animates in BOTH views (FULL too)', async () => {
    mockMatchMedia({ reducedMotion: false });
    await renderDigestReader();

    // Switch to FULL via the radiogroup (AC-3: header block shows in both).
    // NOTE: handleSetView persists the choice to the URL (?view=full) —
    // restore the URL so later tests' readers don't inherit FULL.
    try {
      fireEvent.click(screen.getByRole('radio', { name: 'ฉบับเต็ม' }));
      expect(historyList()).not.toBeNull();

      fireEvent.click(historyToggle());
      expect(historyWrapper()!.style.gridTemplateRows).toBe('1fr');
      expect(historyList()!.hasAttribute('inert')).toBe(false);

      fireEvent.click(historyToggle());
      expect(historyWrapper()!.style.gridTemplateRows).toBe('0fr');
      expect(historyList()!.hasAttribute('inert')).toBe(true);
    } finally {
      window.history.replaceState(null, '', '/');
    }
  });
});

describe('T36 — restoreMemberFocus inert guard (AC-0, senior MAJOR-2)', () => {
  beforeEach(() => {
    stubDigestJsdomGaps();
    // jsdom keeps ONE window (and URL) for the whole file — any earlier
    // ?view= handling would poison later readers' mount initializer
    // (viewMode reads window.location.search). Fresh-load isolation.
    window.history.replaceState(null, '', '/');
  });

  const memberBtn = (key: string) =>
    document.querySelector<HTMLButtonElement>(`[data-lawlib-member="${key}"]`);
  const popover = () => document.querySelector<HTMLElement>('[data-lawlib-popover]');

  /** Advance the reader's 50ms open window + setTimeout(0) focus restore. */
  async function settle(ms = 80) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
  }

  it('happy path: Esc restores focus to the last-clicked member (guard keeps the visible case working)', async () => {
    // Routing semantics — reduced-motion ON (file default).
    await renderDigestReader();

    fireEvent.click(memberBtn('5')!);
    await settle();
    expect(popover()).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    await settle(10);

    expect(popover()).toBeNull();
    expect(document.activeElement).toBe(memberBtn('5'));
  });

  it('inert guard: a member inside a collapsed (inert) group is skipped → first-member fallback', async () => {
    await renderDigestReader();

    // Open the MERGED card (มาตรา 11 - มาตรา 12) via member 12 — the
    // last-interacted member becomes 12.
    fireEvent.click(memberBtn('12')!);
    await settle();
    expect(popover()).not.toBeNull();

    // Post-T35 reality: a collapsed group is `inert` + grid 0fr — its
    // members KEEP a non-null offsetParent (the grid retains layout boxes).
    // Emulate that browser contract for EVERY member: under the OLD
    // offsetParent guard member 12 would look "visible" and get the restore
    // (an inert no-op in a real browser); the inert guard must skip it.
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-lawlib-member]'))) {
      Object.defineProperty(el, 'offsetParent', { configurable: true, value: document.body });
    }

    // Collapse the ch-1 group (บททั่วไป — expanded by default) while the
    // popover stays pinned → the region collapses to 0fr and its inner
    // content wrapper becomes inert (T35 markup: the id stays on the grid
    // wrapper; inert rides on the overflow-hidden inner div).
    const section = document.querySelector('section[aria-label="มาตราสำคัญ"]');
    const disclosure = Array.from(section?.querySelectorAll('h3 button') ?? []).find((b) =>
      b.textContent?.includes('บททั่วไป'),
    ) as HTMLButtonElement;
    fireEvent.click(disclosure);
    const region = document.getElementById('ch-1-region') as HTMLElement;
    expect(region.style.gridTemplateRows).toBe('0fr');
    expect(region.firstElementChild?.hasAttribute('inert')).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    await settle(10);

    expect(popover()).toBeNull();
    // Member 12 sits in an inert subtree → skipped → the card's FIRST
    // member (11) receives the restore attempt.
    expect(document.activeElement).toBe(memberBtn('11'));
  });
});

// ---------------------------------------------------------------------------
// T37 (ADR-024 D4 — FULL|COMPACT segmented pill, user-locked 2026-08-10)
// ---------------------------------------------------------------------------

describe('T37 — FULL|COMPACT segmented pill', () => {
  beforeEach(() => {
    stubDigestJsdomGaps();
    // handleSetView persists ?view= to the URL — fresh-load isolation.
    window.history.replaceState(null, '', '/');
  });

  const radiogroup = () => screen.getByRole('radiogroup', { name: 'มุมมองการอ่าน' });
  const fullRadio = () => screen.getByRole('radio', { name: 'ฉบับเต็ม' });
  const compactRadio = () => screen.getByRole('radio', { name: 'เวอร์ชันย่อ' });
  const knob = () => radiogroup().querySelector<HTMLElement>('[aria-hidden="true"]');

  it('knob: absolute 50%−4px pill, transform-only 200ms ease-ios-out; translate per state', async () => {
    await renderDigestReader();

    // Compact is the digest default → the knob sits over the SECOND half.
    const k = knob();
    expect(k).not.toBeNull();
    expect(k!.className).toContain('absolute');
    expect(k!.className).toContain('inset-y-1');
    expect(k!.className).toContain('left-1');
    expect(k!.className).toContain('w-[calc(50%_-_4px)]');
    expect(k!.className).toContain('rounded-full');
    expect(k!.className).toContain('bg-blue-700');
    expect(k!.className).toContain('dark:bg-blue-600');
    expect(k!.className).toContain('translate-x-full'); // compact selected
    // D10: knob animates TRANSFORM only — 300ms ease-ios-out (user lock).
    expect(k!.className).toContain('transition-transform');
    expect(k!.className).toContain('duration-300');
    expect(k!.className).toContain('ease-ios-out');
    expect(k!.className).not.toContain('transition-colors');
    // RM: the global reduced-motion kill (globals.css) zeroes
    // transition-duration — instant, no JS gate (verified live).

    // FULL selected → knob slides to the FIRST half.
    fireEvent.click(fullRadio());
    expect(k!.className).toContain('translate-x-0');
    expect(k!.className).not.toContain('translate-x-full');

    // Back to compact → slides across again.
    fireEvent.click(compactRadio());
    expect(k!.className).toContain('translate-x-full');
    expect(k!.className).not.toContain('translate-x-0');
  });

  it('container: relative pill, NO gap (F2); buttons flex-1 (MINOR-5) z-10, transparent bg, color-only', async () => {
    await renderDigestReader();
    const rg = radiogroup();
    expect(rg.className).toContain('relative');
    expect(rg.className).toContain('rounded-full');
    expect(rg.className).toContain('p-1');
    // The knob math (50%−4px + translate-x-full) lands flush ONLY on
    // touching halves — a gap would leave the knob 4px short of flush.
    expect(rg.className).not.toMatch(/\bgap-/);

    for (const b of [fullRadio(), compactRadio()]) {
      expect(b.className).toContain('flex-1'); // labels differ in width
      expect(b.className).toContain('relative');
      expect(b.className).toContain('z-10'); // ring stays ABOVE the knob
      expect(b.className).toContain('transition-colors');
      expect(b.className).toContain('duration-200');
      // The selected SURFACE lives on the knob now — buttons are transparent.
      expect(b.className).not.toContain('bg-blue-700');
      expect(b.className).not.toContain('dark:bg-blue-600');
    }
    // Text colors unchanged: selected white, unselected blue-800/dark-300.
    expect(fullRadio().className).toContain('text-blue-800');
    expect(fullRadio().className).toContain('dark:text-blue-300');
    expect(compactRadio().className).toContain('text-white');
  });

  it('keyboard arrows still switch views; aria-checked + roving tabIndex track the state', async () => {
    await renderDigestReader();
    expect(compactRadio().getAttribute('aria-checked')).toBe('true');
    expect(compactRadio().tabIndex).toBe(0);
    expect(fullRadio().getAttribute('aria-checked')).toBe('false');
    expect(fullRadio().tabIndex).toBe(-1);

    fireEvent.keyDown(radiogroup(), { key: 'ArrowLeft' });
    expect(fullRadio().getAttribute('aria-checked')).toBe('true');
    expect(fullRadio().tabIndex).toBe(0);
    expect(compactRadio().getAttribute('aria-checked')).toBe('false');
    expect(compactRadio().tabIndex).toBe(-1);

    fireEvent.keyDown(radiogroup(), { key: 'ArrowRight' });
    expect(compactRadio().getAttribute('aria-checked')).toBe('true');
    expect(compactRadio().tabIndex).toBe(0);
  });
});
