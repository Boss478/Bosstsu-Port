// @vitest-environment jsdom
/**
 * LawLib tooltip — quick-note hub (T10a ADR-019 D7) contract tests.
 *
 * The hub is a timing-sensitive surface (500ms debounce + unmount flush),
 * previously smoke-tested only. These jsdom + fake-timer tests pin:
 *  (a) 500ms debounce save — one save AFTER the last keystroke
 *  (b) unmount flush — a closing tooltip must not drop the last keystrokes
 *  (c) '' input → the latest note is deleted (upsert contract: '' + existing)
 *  (d) ref→ref swap → the draft RESETS to the new article's note AND the
 *      pending draft flushes to the OLD article (BLOCKER regression — the
 *      keyed ArticleHub remount)
 *  (e) "เปิดโน้ตทั้งแผง" closes the tooltip BEFORE opening the notes drawer
 *      (sanctioned close path — buttons never bypass closeTooltip)
 *
 * jsdom gaps: none beyond the usual (geometry is bypassed via sheet=true).
 * The hub is exercised through the REAL LawTooltip portal (like
 * tooltip.test.tsx) with a stateful wrapper that swaps content + hub the way
 * the reader does on ref→ref tooltip replacement.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import LawTooltip, { type LawTooltipHub } from '@/components/LawTooltip';
import type { TooltipContent } from '@/hooks/useLawTooltip';
import type { LawDoc } from '@/types/lawlib';

/** Minimal law: ONE chapter, TWO plain-text articles (ref A / ref B). */
const law: LawDoc = {
  slug: 'quick-note-test',
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
        { no: 1, text: [{ kind: 'text', t: 'ข้อความ ก' }] },
        { no: 2, text: [{ kind: 'text', t: 'ข้อความ ข' }] },
      ],
    },
  ],
};

const ANCHOR = { left: 0, top: 0, right: 100, bottom: 24, width: 100, height: 24 } as DOMRect;

/** Every hub callback defaults to a spy so tests assert on what they want. */
function makeHub(overrides: Partial<LawTooltipHub>): LawTooltipHub {
  return {
    isBookmarked: false,
    onToggleBookmark: vi.fn(),
    noteText: '',
    onNoteSave: vi.fn(),
    onOpenNotes: vi.fn(),
    onCopyLink: vi.fn(),
    ...overrides,
  };
}

/** One tooltip open state: same-law ref content + its article hub. */
function makeItem(
  articleNo: number,
  display: string,
  noteText: string,
  onNoteSave: (text: string) => void,
): { content: TooltipContent; hub: LawTooltipHub } {
  return {
    content: { kind: 'ref', articleNo, display },
    hub: makeHub({ noteText, onNoteSave }),
  };
}

/** Wrapper — mirrors the reader wiring: content + hub swap together. */
function QuickNoteHarness({
  item,
  onClose,
}: {
  item: { content: TooltipContent; hub: LawTooltipHub };
  onClose: () => void;
}) {
  return (
    <LawTooltip
      content={item.content}
      anchorRect={ANCHOR}
      sheet={true} // bottom-sheet layout — skips positioning (jsdom-safe)
      law={law}
      onClose={onClose}
      onOpenArticle={() => {}}
      registerTooltipEl={() => {}}
      onPointerLeave={() => {}}
      hub={item.hub}
    />
  );
}

const textarea = () => screen.getByRole('textbox', { name: 'โน้ตด่วนสำหรับมาตราที่เปิด' });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('QuickNoteBox — debounced autosave (ADR-019 D7)', () => {
  it('(a) saves ONCE, 500ms after the last keystroke (debounce)', () => {
    const onNoteSave = vi.fn();
    const item = makeItem(1, 'มาตรา 1', '', onNoteSave);
    render(<QuickNoteHarness item={item} onClose={() => {}} />);

    fireEvent.change(textarea(), { target: { value: 'ข้อความด่วน' } });

    // Inside the debounce window → no save yet.
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(onNoteSave).not.toHaveBeenCalled();

    // 500ms after the keystroke → exactly one save with the full draft.
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onNoteSave).toHaveBeenCalledTimes(1);
    expect(onNoteSave).toHaveBeenCalledWith('ข้อความด่วน');

    // The save is debounced — no further timer keeps firing.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onNoteSave).toHaveBeenCalledTimes(1);
  });

  it('(a) a second keystroke restarts the 500ms window (latest draft wins)', () => {
    const onNoteSave = vi.fn();
    const item = makeItem(1, 'มาตรา 1', '', onNoteSave);
    render(<QuickNoteHarness item={item} onClose={() => {}} />);

    fireEvent.change(textarea(), { target: { value: 'ฉบับ' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.change(textarea(), { target: { value: 'ฉบับที่ 2' } });

    // The FIRST keystroke's window expired mid-typing — must not have saved.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onNoteSave).not.toHaveBeenCalled();

    // 500ms after the LAST keystroke → the final draft, once.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onNoteSave).toHaveBeenCalledTimes(1);
    expect(onNoteSave).toHaveBeenCalledWith('ฉบับที่ 2');
  });

  it('(b) unmount flush — a closing tooltip saves the pending draft immediately', () => {
    const onNoteSave = vi.fn();
    const item = makeItem(1, 'มาตรา 1', '', onNoteSave);
    const { unmount } = render(<QuickNoteHarness item={item} onClose={() => {}} />);

    fireEvent.change(textarea(), { target: { value: 'ยังไม่ครบ 500ms' } });

    // Unmount mid-debounce (tooltip closed by the user) — no timer advance.
    unmount();
    expect(onNoteSave).toHaveBeenCalledTimes(1);
    expect(onNoteSave).toHaveBeenCalledWith('ยังไม่ครบ 500ms');

    // And the pending timer is gone — no double-save after the fact.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onNoteSave).toHaveBeenCalledTimes(1);
  });

  it('(b) unmount flush reports the untouched draft too — the READER no-ops "" + no-note', () => {
    const onNoteSave = vi.fn();
    const item = makeItem(1, 'มาตรา 1', '', onNoteSave);
    const { unmount } = render(<QuickNoteHarness item={item} onClose={() => {}} />);

    unmount();
    // The hub's flush contract: always report the current draft on unmount
    // (handleQuickNoteSave maps '' + no existing note to a no-op).
    expect(onNoteSave).toHaveBeenCalledTimes(1);
    expect(onNoteSave).toHaveBeenCalledWith('');
  });

  it('(c) clearing the input to "" deletes the latest note (upsert contract)', () => {
    const onNoteSave = vi.fn();
    // The article ALREADY has a note → the draft initializes from it.
    const item = makeItem(1, 'มาตรา 1', 'บันทึกเดิม', onNoteSave);
    render(<QuickNoteHarness item={item} onClose={() => {}} />);
    expect((textarea() as HTMLTextAreaElement).value).toBe('บันทึกเดิม');

    fireEvent.change(textarea(), { target: { value: '' } });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    // '' + existing → delete (the reader maps this to deleteNote).
    expect(onNoteSave).toHaveBeenCalledTimes(1);
    expect(onNoteSave).toHaveBeenCalledWith('');
  });
});

describe('QuickNoteBox — ref→ref swap (BLOCKER regression: keyed remount)', () => {
  it('(d) swaps draft to the NEW article and flushes the pending draft to the OLD article', () => {
    const saveA = vi.fn();
    const saveB = vi.fn();
    const itemA = makeItem(1, 'มาตรา 1', 'โน้ต ก', saveA);
    const itemB = makeItem(2, 'มาตรา 2', 'โน้ต ข', saveB);
    const { rerender } = render(<QuickNoteHarness item={itemA} onClose={() => {}} />);
    expect((textarea() as HTMLTextAreaElement).value).toBe('โน้ต ก');

    // Type into A's box — debounce still pending (no timer advance yet).
    fireEvent.change(textarea(), { target: { value: 'โน้ต ก แก้ไข' } });

    // Ref→ref swap: the reader replaces content + hub on the SAME portal
    // root (no unmount of LawTooltip itself). The keyed ArticleHub must
    // remount: A's pending draft flushes to A, and the textarea re-initializes
    // from B's note — it must NOT keep showing A's draft.
    rerender(<QuickNoteHarness item={itemB} onClose={() => {}} />);

    // BLOCKER: A's pending draft saved to the OLD article, exactly once.
    expect(saveA).toHaveBeenCalledTimes(1);
    expect(saveA).toHaveBeenCalledWith('โน้ต ก แก้ไข');
    // ...and B has seen nothing of A's draft.
    expect(saveB).not.toHaveBeenCalled();

    // BLOCKER: the draft RESET to B's latest note.
    expect((textarea() as HTMLTextAreaElement).value).toBe('โน้ต ข');

    // B's box works independently — typing + debounce saves to B only.
    fireEvent.change(textarea(), { target: { value: 'โน้ต ข ใหม่' } });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(saveB).toHaveBeenCalledTimes(1);
    expect(saveB).toHaveBeenCalledWith('โน้ต ข ใหม่');
    expect(saveA).toHaveBeenCalledTimes(1); // unchanged
  });

  it('(d) a ref→ref swap with no pending changes keeps the flush on the OLD article (idempotent reader upsert)', () => {
    const saveA = vi.fn();
    const saveB = vi.fn();
    const itemA = makeItem(1, 'มาตรา 1', 'โน้ต ก', saveA);
    const itemB = makeItem(2, 'มาตรา 2', '', saveB);
    const { rerender } = render(<QuickNoteHarness item={itemA} onClose={() => {}} />);

    rerender(<QuickNoteHarness item={itemB} onClose={() => {}} />);

    // A's unmount flush reports its (untouched) draft — the reader's upsert
    // with the SAME latest text is idempotent. The critical pin: B never
    // receives A's text, and the draft resets to B's (empty) note.
    expect(saveA).toHaveBeenCalledTimes(1);
    expect(saveA).toHaveBeenCalledWith('โน้ต ก');
    expect(saveB).not.toHaveBeenCalled();
    expect((textarea() as HTMLTextAreaElement).value).toBe('');
  });
});

describe('QuickNoteBox — เปิดโน้ตทั้งแผง (sanctioned close path)', () => {
  it('(e) closes the tooltip BEFORE opening the notes drawer', () => {
    const calls: string[] = [];
    const item = makeItem(1, 'มาตรา 1', '', vi.fn());
    item.hub.onOpenNotes = vi.fn(() => calls.push('open-notes'));
    const onClose = vi.fn(() => calls.push('close'));
    render(<QuickNoteHarness item={item} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /เปิดโน้ตทั้งแผง/ }));

    // The hub never bypasses closeTooltip (T10a intake constraint).
    expect(calls).toEqual(['close', 'open-notes']);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(item.hub.onOpenNotes).toHaveBeenCalledTimes(1);
  });
});
