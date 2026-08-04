// @vitest-environment jsdom
/**
 * ReadingDock (FR-C) contract tests (Wave 3, Lane D fixes — Task 6.2).
 *
 * ReadingDock is module-local inside LawlibReaderClient (kept there so its
 * identity stays stable across reader re-renders — see the comment above its
 * definition), so the dock is exercised THROUGH the full reader client:
 * `<ThemeProvider><LawlibReaderClient law={sampleLaw} /></ThemeProvider>`.
 *
 * Pinned here (senior review findings):
 * - chevron disclosure: aria-expanded toggles; aria-controls targets
 *   `#lawlib-dock-actions`
 * - Escape collapses the expander and returns focus to the chevron
 * - while a panel drawer is open the DRAWER owns Escape: the dock's Escape
 *   listener is not attached (activePanel !== null), so Escape closes the
 *   drawer and leaves the expander open
 * - group-2 stays MOUNTED (hidden class) when collapsed — the drawer's
 *   opener.isConnected focus-restore depends on it
 *
 * jsdom gaps stubbed: matchMedia (theme-provider pattern), IntersectionObserver
 * (TocSidebar scroll-spy), localStorage (in-memory store). `next/link` renders
 * a plain <a> (no router in jsdom).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
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

const chevron = () =>
  document.querySelector<HTMLButtonElement>('[aria-controls="lawlib-dock-actions"]');
const actions = () => document.getElementById('lawlib-dock-actions');

beforeEach(() => {
  mockLocalStorage();
  mockMatchMedia(false);
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  document.documentElement.className = '';
  document.documentElement.removeAttribute('data-paper-tone');
  document.body.classList.remove('lawlib-immersive');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Render the reader inside ThemeProvider; flush the mount setTimeout(0). */
async function renderReader() {
  const utils = render(
    <ThemeProvider>
      <LawlibReaderClient law={sampleLaw} />
    </ThemeProvider>,
  );
  // The mount effect defers its first-article activation into setTimeout(0) —
  // let it settle inside act so no state update lands outside it.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  return utils;
}

describe('ReadingDock disclosure (FR-C)', () => {
  it('chevron toggles aria-expanded and aria-controls the actions group', async () => {
    await renderReader();

    const btn = chevron();
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute('aria-expanded')).toBe('false');
    expect(btn?.getAttribute('aria-controls')).toBe('lawlib-dock-actions');

    fireEvent.click(btn as HTMLButtonElement);
    expect(btn?.getAttribute('aria-expanded')).toBe('true');
    expect(actions()?.classList.contains('hidden')).toBe(false);

    fireEvent.click(btn as HTMLButtonElement);
    expect(btn?.getAttribute('aria-expanded')).toBe('false');
    expect(actions()?.classList.contains('hidden')).toBe(true);
  });

  it('group-2 stays MOUNTED (hidden) when collapsed — drawer focus-restore depends on it', async () => {
    await renderReader();

    const btn = chevron() as HTMLButtonElement;
    expect(actions()).not.toBeNull();

    fireEvent.click(btn);
    expect(actions()?.classList.contains('hidden')).toBe(false);

    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    // Collapsed = hidden, NOT unmounted.
    expect(actions()).not.toBeNull();
    expect(actions()?.classList.contains('hidden')).toBe(true);
  });
});

describe('ReadingDock Escape handling (FR-C)', () => {
  it('Escape collapses the expander and returns focus to the chevron', async () => {
    await renderReader();

    const btn = chevron() as HTMLButtonElement;
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    // Opening moved focus to the first action button (a11y — L4-1).
    expect(document.activeElement).not.toBe(btn);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(btn);
  });

  it('Escape no-ops on the expander while a panel drawer is open (drawer wins)', async () => {
    await renderReader();

    const btn = chevron() as HTMLButtonElement;
    fireEvent.click(btn);
    fireEvent.click(screen.getByRole('button', { name: 'ค้นหามาตรา' }));

    // Drawer is open and the expander is still expanded.
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(btn.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(document, { key: 'Escape' });

    // The DRAWER owned Escape: it closed, the expander stayed open.
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });
});
