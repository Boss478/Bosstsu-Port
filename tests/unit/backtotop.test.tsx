// @vitest-environment jsdom
/**
 * BackToTop (T22) — hides while the mobile lawlib dock sheet is open.
 *
 * LawlibDock dispatches `lawlib:dock-sheet` with `detail.open` when the
 * mobile bottom sheet's open state changes (`expanded && isMobile`).
 * BackToTop listens and drops to the invisible/opacity-0/pointer-events-none
 * state while the sheet covers its corner. Closed sheet / desktop →
 * `open: false` → visibility follows the scroll listener only (T21
 * behavior untouched).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup, waitFor, screen, act } from '@testing-library/react';
import BackToTop from '@/components/BackToTop';

function setScrollY(y: number): void {
  Object.defineProperty(window, 'scrollY', {
    value: y,
    configurable: true,
    writable: true,
  });
}

function dispatchSheet(open: boolean): void {
  // The event triggers a React state update — act() keeps the listener's
  // setState inside a test-aware batch (same reason fireEvent wraps).
  act(() => {
    window.dispatchEvent(new CustomEvent('lawlib:dock-sheet', { detail: { open } }));
  });
}

describe('BackToTop — T22 dock-sheet hiding', () => {
  beforeEach(() => {
    // Run the rAF-throttled scroll handler synchronously → the listener
    // settles in the same tick as the scroll event.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    setScrollY(0);
  });

  afterEach(() => {
    cleanup();
  });

  it('hides while the sheet is open and returns when it closes', async () => {
    render(<BackToTop />);
    const button = screen.getByRole('button', { name: 'กลับขึ้นบน' });

    // Not scrolled → hidden regardless of the sheet.
    expect(button.className).toContain('invisible');

    // Scrolled past 200px → visible (T21 baseline).
    setScrollY(600);
    fireEvent.scroll(window);
    await waitFor(() => expect(button.className).toContain('opacity-100'));
    expect(button.className).toContain('translate-y-0');
    expect(button.className).toContain('pointer-events-auto');
    expect(button.getAttribute('tabindex')).toBe('0');

    // Sheet opens → hidden again + untabbable (the sheet covers the corner).
    dispatchSheet(true);
    await waitFor(() => {
      expect(button.className).toContain('invisible');
      expect(button.className).toContain('opacity-0');
    });
    expect(button.className).toContain('pointer-events-none');
    expect(button.getAttribute('tabindex')).toBe('-1');

    // Sheet closes → visible again + tabbable (scroll state unchanged).
    dispatchSheet(false);
    await waitFor(() => expect(button.className).toContain('opacity-100'));
    expect(button.getAttribute('tabindex')).toBe('0');
  });

  it('stays hidden once the sheet is open, even if the user scrolls afterwards', async () => {
    // Real mount order: BackToTop (layout, SSR'd) mounts BEFORE the dock
    // (ssr:false shell) — the dock's mount effect dispatches { open: true }
    // while the listener is already registered. The event must land even
    // before the user ever scrolls.
    render(<BackToTop />);
    dispatchSheet(true);

    setScrollY(600);
    fireEvent.scroll(window);
    const button = screen.getByRole('button', { name: 'กลับขึ้นบน' });
    await waitFor(() => {
      expect(button.className).toContain('invisible');
      expect(button.className).toContain('opacity-0');
    });
    expect(button.getAttribute('tabindex')).toBe('-1');

    dispatchSheet(false);
    await waitFor(() => expect(button.className).toContain('opacity-100'));
    expect(button.getAttribute('tabindex')).toBe('0');
  });
});
