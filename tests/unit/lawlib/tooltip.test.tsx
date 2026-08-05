// @vitest-environment jsdom
/**
 * LawLib tooltip — a11y wiring tests (plan compact-tooltip-parity-plan.md v6,
 * implementation-order commit 3: "Tooltip id").
 *
 * Coverage (TRACK B):
 *  - useLawTooltip exposes ONE stable tooltipId per instance, unchanged
 *    across open/close cycles (React useId)
 *  - LawTooltip portal root carries that id (aria-describedby target)
 *  - ArticleView article-header trigger renders
 *    `aria-describedby={isTooltipOpen ? tooltipId : undefined}` — present
 *    while open, absent when closed; glossary/ref spans untouched
 *  - regression pin: mouse pointerenter opens / pointerleave closes
 *    (existing semantics intact — this commit is a11y wiring ONLY)
 *
 * Extensibility: the compact-feature track extends THIS file with reader-level
 * pins (Esc close, sameContent guard, touch pointerup <10px, "Esc-restore does
 * not reopen"). Keep additions additive — the helpers + Harness below are
 * shared and must not change shape.
 *
 * jsdom gaps stubbed: matchMedia (sheet check in openTooltip).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, fireEvent, screen, act } from '@testing-library/react';
import { useLawTooltip, type TooltipContent } from '@/hooks/useLawTooltip';
import ArticleView from '@/components/ArticleView';
import LawTooltip from '@/components/LawTooltip';
import type { LawDoc } from '@/types/lawlib';

/** jsdom has no matchMedia — stub it; `matches` = <640px (bottom-sheet). */
function mockMatchMedia(matches: boolean): void {
  const mql = {
    matches,
    media: '(max-width: 639px)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
}

/**
 * Minimal law: ONE chapter, ONE plain-text article, no definitions → in
 * singleKey mode ArticleView renders exactly ONE trigger (the header span).
 */
const law: LawDoc = {
  slug: 'tooltip-test',
  code: 'พ.ร.บ. ทดสอบ',
  titleTh: 'กฎหมายทดสอบ',
  subject: 'ทดสอบ',
  part: 'ก',
  tags: [],
  verifiedAt: '2026-08-05',
  gazetteRef: '—',
  editions: [],
  definitions: [],
  chapters: [
    {
      no: 1,
      title: 'หมวด 1',
      articles: [{ no: 1, text: [{ kind: 'text', t: 'ข้อความทดสอบ' }] }],
    },
  ],
};

const headerContent: TooltipContent = { kind: 'ref', articleNo: 1, display: 'มาตรา 1' };

/**
 * Mirrors the reader's wiring (LawlibReaderClient): useLawTooltip drives
 * ArticleView (singleKey mode) AND the LawTooltip portal, passing tooltipId
 * to both. Exposes the id via data-testid so tests can cross-check the
 * trigger's aria-describedby against the ACTUAL portal root id.
 */
function Harness() {
  const {
    tooltip,
    getTriggerProps,
    isTooltipOpen,
    tooltipId,
    closeTooltip,
    registerTooltipEl,
    handleTooltipPointerLeave,
  } = useLawTooltip();

  return (
    <div>
      <span data-testid="tooltip-id">{tooltipId}</span>
      <ArticleView
        law={law}
        highlights={[]}
        noteKeys={new Set()}
        flashKey={null}
        getTriggerProps={getTriggerProps}
        isTooltipOpen={isTooltipOpen}
        tooltipId={tooltipId}
        singleKey="1"
      />
      {tooltip !== null && (
        <LawTooltip
          content={tooltip.content}
          anchorRect={tooltip.anchorRect}
          sheet={tooltip.sheet}
          law={law}
          onClose={closeTooltip}
          onOpenArticle={() => {}}
          registerTooltipEl={registerTooltipEl}
          onPointerLeave={handleTooltipPointerLeave}
          tooltipId={tooltipId}
        />
      )}
    </div>
  );
}

const tooltipRoot = () => document.body.querySelector<HTMLElement>('[role="tooltip"]');
const headerTrigger = () => screen.getByRole('button', { name: 'มาตรา 1' });

beforeEach(() => {
  mockMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useLawTooltip — stable tooltip id', () => {
  it('exposes a non-empty tooltipId that is stable across open/close cycles', () => {
    const { result } = renderHook(() => useLawTooltip());
    const anchor = document.createElement('span');

    const first = result.current.tooltipId;
    expect(first).toBeTypeOf('string');
    expect(first.length).toBeGreaterThan(0);

    for (let i = 0; i < 3; i++) {
      act(() => result.current.openTooltip(headerContent, anchor));
      expect(result.current.tooltip).not.toBeNull();
      expect(result.current.tooltipId).toBe(first);

      act(() => result.current.closeTooltip());
      expect(result.current.tooltip).toBeNull();
      expect(result.current.tooltipId).toBe(first);
    }
  });
});

describe('LawTooltip — root carries the stable id', () => {
  it('renders the portal root with id={tooltipId}', () => {
    render(
      <LawTooltip
        content={headerContent}
        anchorRect={{ left: 0, top: 0, right: 100, bottom: 24, width: 100, height: 24 } as DOMRect}
        sheet={true} // skip positioning — jsdom-safe
        law={law}
        onClose={() => {}}
        onOpenArticle={() => {}}
        registerTooltipEl={() => {}}
        onPointerLeave={() => {}}
        tooltipId="lawlib-tooltip-test-id"
      />,
    );

    const root = tooltipRoot();
    expect(root).not.toBeNull();
    expect(root?.id).toBe('lawlib-tooltip-test-id');
  });

  it('renders without an id when tooltipId is absent (pre-wiring callers)', () => {
    render(
      <LawTooltip
        content={headerContent}
        anchorRect={{ left: 0, top: 0, right: 100, bottom: 24, width: 100, height: 24 } as DOMRect}
        sheet={true}
        law={law}
        onClose={() => {}}
        onOpenArticle={() => {}}
        registerTooltipEl={() => {}}
        onPointerLeave={() => {}}
      />,
    );

    const root = tooltipRoot();
    expect(root).not.toBeNull();
    expect(root?.hasAttribute('id')).toBe(false);
  });
});

describe('aria-describedby wiring (ArticleView header trigger)', () => {
  it('has no aria-describedby while the tooltip is closed', () => {
    render(<Harness />);

    const trigger = headerTrigger();
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
    expect(tooltipRoot()).toBeNull();
  });

  it('references the stable tooltip id while open and drops it when closed', () => {
    render(<Harness />);
    const trigger = headerTrigger();
    const tooltipId = screen.getByTestId('tooltip-id').textContent ?? '';

    // open (mouse pointerenter) → describedby = the ACTUAL portal root id
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull();
    expect(tooltipRoot()?.id).toBe(tooltipId);
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltipId);

    // close (mouse pointerleave) → attribute gone, portal gone
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).toBeNull();
    expect(trigger.getAttribute('aria-describedby')).toBeNull();

    // reopen → the SAME id (stable across cycles at the DOM level)
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()?.id).toBe(tooltipId);
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltipId);
  });

  it('does not wire aria-describedby on glossary/ref spans (loop-5 INFO scope)', () => {
    const { container } = render(<Harness />);
    // The fixture renders NO glossary/ref spans — pin that the describedby
    // wiring stays confined to the header trigger: every [data-lawlib-trigger]
    // with aria-describedby must be the header (only one trigger exists).
    const described = container.querySelectorAll('[data-lawlib-trigger][aria-describedby]');
    expect(described.length).toBe(0);
  });
});

describe('regression pins — pointer semantics unchanged', () => {
  it('mouse pointerenter opens the tooltip and pointerleave closes it', () => {
    render(<Harness />);
    const trigger = headerTrigger();

    // closed baseline
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(tooltipRoot()).not.toBeNull();

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(tooltipRoot()).toBeNull();
  });

  it('pointer moving into the tooltip portal keeps it open (containment exemption)', () => {
    render(<Harness />);
    const trigger = headerTrigger();

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    const root = tooltipRoot();
    expect(root).not.toBeNull();

    // trigger → portal: pointerleave on the trigger with relatedTarget = the
    // portal root must NOT close (moving into the tooltip keeps it open).
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse', relatedTarget: root as Element });
    expect(tooltipRoot()).not.toBeNull();
    expect(trigger.getAttribute('aria-describedby')).not.toBeNull();

    // portal → elsewhere: the portal's own pointerleave closes it.
    fireEvent.pointerLeave(root as HTMLElement, { pointerType: 'mouse' });
    expect(tooltipRoot()).toBeNull();
  });

  it('non-mouse pointer (touch) does not hover-open (pointerType gate)', () => {
    render(<Harness />);
    const trigger = headerTrigger();

    fireEvent.pointerEnter(trigger, { pointerType: 'touch' });
    expect(tooltipRoot()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
