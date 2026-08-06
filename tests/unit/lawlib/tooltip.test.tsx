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
 *  - T12b: root panel = glass (slider vars + blur-xs + sheen), content keeps
 *    its own solid surface (AA on a 35%-transparent panel)
 *
 * Extensibility: the compact-feature track extends THIS file with reader-level
 * pins (Esc close, sameContent guard, touch pointerup <10px, "Esc-restore does
 * not reopen"). Keep additions additive — the helpers + Harness below are
 * shared and must not change shape.
 *
 * T1 click-pin + union-zone guard (ADR-018 D1, plan lawlib-ui-glassmorphism
 * fixes rev.4): mouse click = pin (survives pointerleave, closes on Esc /
 * outside / toggle / scrollend / resize), hover = preview with a content-gated
 * union-zone guard (trigger ∪ tooltip ∪ 12px corridor, 150ms grace) REPLACING
 * the relatedTarget containment mechanism, mouse drag-guard ≥10px, and
 * touch/keyboard regression pins. jsdom geometry is stubbed per test —
 * getBoundingClientRect returns zeros by default, NaN must count as "outside".
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
  vi.useRealTimers();
  vi.restoreAllMocks();
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

  it('T12b: the root PANEL is glass (slider vars + blur-xs + sheen) while the CONTENT keeps its own solid surface', () => {
    render(
      <LawTooltip
        content={headerContent}
        anchorRect={{ left: 0, top: 0, right: 100, bottom: 24, width: 100, height: 24 } as DOMRect}
        sheet={false} // desktop variant — the common case for the surface
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
    // The panel consumes the same glass mechanism as the dock Level-1:
    // slider-driven fill (--lawlib-glass-bg-*) + blur-xs + top sheen.
    expect(root?.className).toContain('lawlib-glass');
    expect(root?.className).toContain('lawlib-glass-xs');
    expect(root?.className).toContain('lawlib-glass-sheen');
    // The old solid ROOT fill moved off the panel…
    expect(root?.className).not.toContain('bg-white');
    expect(root?.className).not.toContain('dark:bg-slate-900');
    // …onto the inner content wrapper — body text stays ≥4.5:1 on a 35%
    // transparent panel (the AA contract of T12b).
    const inner = root?.querySelector<HTMLElement>('.rounded-xl.bg-white');
    expect(inner).not.toBeNull();
    expect(inner?.textContent).toContain('มาตรา 1');
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

  it('non-mouse pointer (touch) does not hover-open (pointerType gate)', () => {
    render(<Harness />);
    const trigger = headerTrigger();

    fireEvent.pointerEnter(trigger, { pointerType: 'touch' });
    expect(tooltipRoot()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  // T1 (ADR-018 D1): the old "pointer moving into the tooltip portal keeps it
  // open (containment exemption)" test asserted the relatedTarget mechanism
  // (broken under React 19 synthesized pointerleave, relatedTarget=window).
  // It is REWRITTEN as union-guard semantics — see the T1 union-zone suite
  // below ("pointer moving into the tooltip union zone keeps it open").
});

// ---------------------------------------------------------------------------
// T1 — tooltip click-pin + union-zone hover guard (ADR-018 D1, plan rev.4)
// Future behavior (implementation NOT yet in useLawTooltip — these RED tests
// are the contract for the T1 build step):
//   mouse click = PIN (survives pointerleave; closes on Esc / pointerdown
//     outside / closeTooltip / toggle re-click / scrollend / resize; pinned
//     is NOT keyboard mode — no focus side effects)
//   hover = preview with a content-gated union-zone guard (trigger ∪ tooltip
//     ∪ 12px corridor, 150ms grace) REPLACING the relatedTarget mechanism
//   drag guard: mouse pointer movement ≥10px must not open at all
//   touch tap-pin + keyboard sticky semantics UNCHANGED
// ---------------------------------------------------------------------------

type Rect = {
  x: number;
  y: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

/** Geometry fixtures — trigger above the tooltip with a 20px gap (corridor). */
const TRIGGER_RECT: Rect = {
  x: 100,
  y: 100,
  left: 100,
  top: 100,
  right: 200,
  bottom: 130,
  width: 100,
  height: 30,
};
const TRIGGER_B_RECT: Rect = {
  x: 300,
  y: 100,
  left: 300,
  top: 100,
  right: 400,
  bottom: 130,
  width: 100,
  height: 30,
};
const TOOLTIP_RECT: Rect = {
  x: 100,
  y: 150,
  left: 100,
  top: 150,
  right: 400,
  bottom: 300,
  width: 300,
  height: 150,
};
const ZERO_RECT: Rect = {
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
};
const NAN_RECT: Rect = {
  x: NaN,
  y: NaN,
  left: NaN,
  top: NaN,
  right: NaN,
  bottom: NaN,
  width: NaN,
  height: NaN,
};

/**
 * jsdom getBoundingClientRect returns zeros everywhere — stub it with explicit
 * geometry per test. Elements not matched by `rectFor` get a zero rect.
 * (NaN coords in the returned rects MUST be treated as "outside" by the
 * union-zone guard — asserted in the NaN test below.)
 */
function stubRects(rectFor: (el: Element) => Rect): void {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return { ...rectFor(this) } as DOMRect;
  });
}

/** Single-trigger layout (the Harness): trigger + tooltip portal, else zero. */
function stubHarnessRects(triggerRect: Rect, tooltipRect: Rect): void {
  stubRects((el) => {
    if (el.matches('[data-lawlib-trigger]')) return triggerRect;
    if (el.getAttribute('role') === 'tooltip') return tooltipRect;
    return ZERO_RECT;
  });
}

const glossaryA: TooltipContent = { kind: 'glossary', term: 'นิยาม ก', definition: 'คำนิยาม ก' };
const glossaryB: TooltipContent = { kind: 'glossary', term: 'นิยาม ข', definition: 'คำนิยาม ข' };

/**
 * T1 pin harness — N triggers + the portal, exposes openedByKeyboard. Mirrors
 * the reader wiring (getTriggerProps + LawTooltip, data-lawlib-trigger on each
 * trigger like ArticleView). Used by the trigger→trigger and keyboard-mode
 * tests. Additive — Harness above stays untouched.
 */
function PinHarness({ triggers }: { triggers: TooltipContent[] }) {
  const {
    tooltip,
    getTriggerProps,
    isTooltipOpen,
    tooltipId,
    closeTooltip,
    registerTooltipEl,
    handleTooltipPointerLeave,
    openedByKeyboard,
  } = useLawTooltip();

  return (
    <div>
      <span data-testid="kbd-mode">{openedByKeyboard ? 'keyboard' : 'pointer'}</span>
      {triggers.map((content, i) => (
        <button
          key={i}
          type="button"
          data-testid={`pin-trigger-${i}`}
          data-lawlib-trigger
          aria-expanded={isTooltipOpen(content)}
          {...getTriggerProps(content)}
        >
          {content.kind === 'ref' ? content.display : content.term}
        </button>
      ))}
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

/** Pointer sequence for a mouse click (pointerdown → pointerup → click). */
function mouseClick(el: HTMLElement, x: number, y: number): void {
  fireEvent.pointerDown(el, { pointerType: 'mouse', clientX: x, clientY: y });
  fireEvent.pointerUp(el, { pointerType: 'mouse', clientX: x, clientY: y });
  fireEvent.click(el);
}

describe('T1 click-pin — mouse pointer (ADR-018 D1)', () => {
  it('mouse click pins the tooltip: pointerleave does not close it', () => {
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();

    // pointerdown + pointerup (<10px movement) + click = pin
    mouseClick(trigger, 150, 115);
    expect(tooltipRoot()).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    // pinned → moving the pointer away must NOT close
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('pinned tooltip closes on Escape', () => {
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();
    mouseClick(trigger, 150, 115);
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull(); // pinned survives the exit

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(tooltipRoot()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('pinned tooltip closes on pointerdown outside the trigger/tooltip', () => {
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();
    mouseClick(trigger, 150, 115);
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull(); // pinned

    fireEvent.pointerDown(document.body, { pointerType: 'mouse' });
    expect(tooltipRoot()).toBeNull();
  });

  it('pinned tooltip closes on scrollend', () => {
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();
    mouseClick(trigger, 150, 115);
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull(); // pinned

    act(() => {
      document.dispatchEvent(new Event('scrollend'));
    });
    expect(tooltipRoot()).toBeNull();
  });

  it('pinned tooltip closes on resize', () => {
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();
    mouseClick(trigger, 150, 115);
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull(); // pinned

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(tooltipRoot()).toBeNull();
  });

  it('re-clicking a pinned trigger toggles it closed (pointer branch only)', () => {
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();
    mouseClick(trigger, 150, 115);
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull(); // pinned

    // second pointer-click on the SAME trigger → toggle closed
    mouseClick(trigger, 150, 115);
    expect(tooltipRoot()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('hover-open preview + mouse click on the same trigger pins it (survives the 150ms hover grace)', () => {
    vi.useFakeTimers(); // discriminate pin from hover-preview: past the grace
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();

    // hover-open = preview (pointerenter), NOT pinned yet
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    // mouse click on the SAME trigger (<10px movement) → pin
    mouseClick(trigger, 150, 115);
    expect(tooltipRoot()).not.toBeNull();

    // pinned → pointerleave must NOT schedule a deferred close: the tooltip
    // survives well past the 150ms hover-preview grace (a plain preview would
    // be closed by the timer firing here).
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(tooltipRoot()).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('pinned tooltip closes via the X close button (closeTooltip path)', () => {
    mockMatchMedia(true); // sheet layout → the X (ปิด) button renders
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();

    mouseClick(trigger, 150, 115);
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull(); // pinned survives the exit

    // the X button wires to onClose = closeTooltip — it must close a PINNED
    // tooltip (the reader-facing close path, unlike Esc/outside/toggle).
    fireEvent.click(screen.getByRole('button', { name: 'ปิด' }));
    expect(tooltipRoot()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('mouse click with >=10px pointer movement does not open at all (drag guard)', () => {
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();

    // pointerdown at (10,10) → pointerup at (30,10): 20px drag — must NOT open
    fireEvent.pointerDown(trigger, { pointerType: 'mouse', clientX: 10, clientY: 10 });
    fireEvent.pointerUp(trigger, { pointerType: 'mouse', clientX: 30, clientY: 10 });
    fireEvent.click(trigger);
    expect(tooltipRoot()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('pinned state is NOT keyboard mode — openedByKeyboard stays false (no focus side effects)', () => {
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<PinHarness triggers={[headerContent]} />);
    const trigger = screen.getByTestId('pin-trigger-0');

    mouseClick(trigger, 150, 115);
    expect(tooltipRoot()).not.toBeNull();
    expect(screen.getByTestId('kbd-mode').textContent).toBe('pointer');

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull(); // pinned
    expect(screen.getByTestId('kbd-mode').textContent).toBe('pointer');

    // closing a pinned tooltip must not enter/leave keyboard focus semantics
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(tooltipRoot()).toBeNull();
    expect(screen.getByTestId('kbd-mode').textContent).toBe('pointer');
  });
});

describe('T1 union-zone hover guard (replaces relatedTarget containment)', () => {
  it('pointer moving into the tooltip union zone keeps it open (union-zone guard)', () => {
    vi.useFakeTimers();
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull();

    // pointerleave DEFERS the close (150ms grace) — no instant close.
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(tooltipRoot()).not.toBeNull();

    // pointermove inside the tooltip rect cancels the deferred close.
    fireEvent.pointerMove(document.body, { pointerType: 'mouse', clientX: 200, clientY: 200 });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(tooltipRoot()).not.toBeNull();
    expect(trigger.getAttribute('aria-describedby')).not.toBeNull();
  });

  it('the relatedTarget exemption is gone — portal-relatedTarget pointerleave closes after the grace', () => {
    vi.useFakeTimers();
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    const root = tooltipRoot();
    expect(root).not.toBeNull();

    // Old mechanism: relatedTarget inside the portal kept the tooltip open with
    // no pointermove at all. New: ONLY an in-zone pointermove cancels — the
    // relatedTarget alone must not; the 150ms grace expires and it closes.
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse', relatedTarget: root as Element });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(tooltipRoot()).toBeNull();
  });

  it('pointermove inside the 12px corridor between trigger and tooltip cancels the deferred close', () => {
    vi.useFakeTimers();
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT); // gap: trigger bottom 130 → tooltip top 150
    render(<Harness />);
    const trigger = headerTrigger();
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });

    // (150, 138): 8px below the trigger's bottom edge, 12px above the tooltip
    // top — inside the 12px corridor. Must cancel the deferred close.
    fireEvent.pointerMove(document.body, { pointerType: 'mouse', clientX: 150, clientY: 138 });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(tooltipRoot()).not.toBeNull();
  });

  it('without a cancelling pointermove the deferred close fires after the 150ms grace', () => {
    vi.useFakeTimers();
    stubHarnessRects(TRIGGER_RECT, TOOLTIP_RECT);
    render(<Harness />);
    const trigger = headerTrigger();
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });

    // 100ms: grace still running — must NOT be an instant close.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(tooltipRoot()).not.toBeNull();

    // 200ms total > 150ms grace → closed.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(tooltipRoot()).toBeNull();
  });

  it('NaN geometry counts as outside — a pointermove cannot cancel the deferred close', () => {
    vi.useFakeTimers();
    stubHarnessRects(NAN_RECT, NAN_RECT);
    render(<Harness />);
    const trigger = headerTrigger();
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });

    // Even a pointermove at in-bounds-looking coords must not cancel when the
    // rects are NaN (comparisons undefined → "outside").
    fireEvent.pointerMove(document.body, { pointerType: 'mouse', clientX: 150, clientY: 200 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(tooltipRoot()).not.toBeNull(); // deferred — not an instant close
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(tooltipRoot()).toBeNull(); // NaN → outside → grace expires
  });

  it('trigger A → trigger B: A’s deferred close cannot kill B’s fresh tooltip (content-gated)', () => {
    vi.useFakeTimers();
    stubRects((el) => {
      if (el.closest('[data-testid="pin-trigger-0"]') !== null) return TRIGGER_RECT;
      if (el.closest('[data-testid="pin-trigger-1"]') !== null) return TRIGGER_B_RECT;
      if (el.getAttribute('role') === 'tooltip') return TOOLTIP_RECT;
      return ZERO_RECT;
    });
    render(<PinHarness triggers={[glossaryA, glossaryB]} />);
    const triggerA = screen.getByTestId('pin-trigger-0');
    const triggerB = screen.getByTestId('pin-trigger-1');

    fireEvent.pointerEnter(triggerA, { pointerType: 'mouse' });
    expect(tooltipRoot()?.textContent).toContain('คำนิยาม ก');

    // leave A → deferred close starts; still open within the grace window
    fireEvent.pointerLeave(triggerA, { pointerType: 'mouse' });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(tooltipRoot()).not.toBeNull();

    // pointer lands on B → B opens with its own content
    fireEvent.pointerEnter(triggerB, { pointerType: 'mouse' });
    expect(tooltipRoot()?.textContent).toContain('คำนิยาม ข');

    // A's deferred close fires now — content-gated: must NOT close B
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(tooltipRoot()).not.toBeNull();
    expect(tooltipRoot()?.textContent).toContain('คำนิยาม ข');
  });
});

describe('T1 regressions — touch tap-pin + keyboard sticky unchanged', () => {
  it('touch tap (<10px movement) still opens (tap-pin)', () => {
    render(<Harness />);
    const trigger = headerTrigger();

    fireEvent.pointerDown(trigger, { pointerType: 'touch', clientX: 10, clientY: 10 });
    fireEvent.pointerUp(trigger, { pointerType: 'touch', clientX: 10, clientY: 10 });
    expect(tooltipRoot()).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('touch drag (>=10px movement) still does not open', () => {
    render(<Harness />);
    const trigger = headerTrigger();

    fireEvent.pointerDown(trigger, { pointerType: 'touch', clientX: 10, clientY: 10 });
    fireEvent.pointerUp(trigger, { pointerType: 'touch', clientX: 40, clientY: 10 });
    expect(tooltipRoot()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('keyboard Enter still opens in sticky mode and scrollend does not close it', () => {
    render(<Harness />);
    const trigger = headerTrigger();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(tooltipRoot()).not.toBeNull();

    // keyboard-sticky: arrow-key page scrolling must not kill it
    act(() => {
      document.dispatchEvent(new Event('scrollend'));
    });
    expect(tooltipRoot()).not.toBeNull();
  });

  it('keyboard Enter re-click still re-opens (no toggle) and Escape closes', () => {
    render(<Harness />);
    const trigger = headerTrigger();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: 'Enter' }); // re-open — NOT a toggle
    expect(tooltipRoot()).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(tooltipRoot()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T13 — ArticleBody fallback repealed badge (no-digest ref, LawTooltip.tsx
// :316-323). The shared fixtures above have no repealedParagraphs; standalone
// fixture mirrors the T11 compact-routing one (มาตรา 6) so the shared
// Harness/law stay untouched. A no-digest ref (kind:'ref' without digest
// fields) renders the ArticleBody branch — the badge must come from the law
// fixture, NOT from DigestRefContent.repealed.
// ---------------------------------------------------------------------------

const repealedLaw: LawDoc = {
  slug: 'tooltip-repealed-test',
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
      articles: [
        {
          no: 6,
          text: [{ kind: 'text', t: 'ให้สถานศึกษาจัดการศึกษา' }],
          repealedParagraphs: [
            {
              paras: 'วรรคสอง',
              repealedBy: 'พระราชบัญญัติทดสอบ (ฉบับที่ 2) พ.ศ. 2545',
              text: 'ความในวรรคสองเดิมถูกยกเลิก',
            },
          ],
        },
      ],
    },
  ],
};

describe('T13 — no-digest ref to a repealed article shows the ถูกยกเลิก badge (ArticleBody fallback)', () => {
  it('renders the badge from the law fixture repealedParagraphs', () => {
    render(
      <LawTooltip
        content={{ kind: 'ref', articleNo: 6, display: 'มาตรา 6' }}
        anchorRect={{ left: 0, top: 0, right: 100, bottom: 24, width: 100, height: 24 } as DOMRect}
        sheet={true} // skip positioning — jsdom-safe
        law={repealedLaw}
        onClose={() => {}}
        onOpenArticle={() => {}}
        registerTooltipEl={() => {}}
        onPointerLeave={() => {}}
        tooltipId="lawlib-tooltip-repealed-test"
      />,
    );

    const root = tooltipRoot();
    expect(root).not.toBeNull();
    // ArticleBody branch (no digest fields → never DigestRefBody): the full
    // article label + body render, and the repealedParagraphs guard paints
    // the ถูกยกเลิก badge — the T13 fallback path in LawTooltip.tsx:316-323.
    expect(root?.textContent).toContain('มาตรา 6');
    expect(root?.textContent).toContain('ถูกยกเลิก');
    expect(root?.textContent).toContain('ให้สถานศึกษาจัดการศึกษา');
  });
});
