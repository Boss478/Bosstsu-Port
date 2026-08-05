// @vitest-environment jsdom
/**
 * Compact view — hover-tooltip ⇄ popover routing tests (TRACK E, plan
 * compact-tooltip-parity-plan.md v6 + FINAL, senior-review fixes).
 *
 * Exercises the FULL reader (LawlibReaderClient + ThemeProvider) with a small
 * digest md run through parseDigestMd → buildView (the reading-dock.test.tsx
 * precedent — the dock and the popover routing share the same state hub).
 *
 * Pinned here (senior-engineer top-5 + plan v6 matrix):
 *  1. merged-member routing: body-ref to member '12' of "มาตรา 11 - มาตรา 12"
 *     opens the merged card's popover (NO FULL switch); same for tooltip
 *     เปิดมาตรานี้ on a merged member
 *  2. member click → popover opens EXACTLY ONCE + tooltip closed
 *  3. guards: body-tap → popover; term-tap → tooltip only; chip → scroll only
 *  4. keyboard: Enter/Space → keyboard-mode tooltip, popover stays closed;
 *     Esc one press closes tooltip AND popover; focus restored to last-clicked
 *     member; merged card Esc restore to the SECOND member; hidden-guard
 *     (collapsed group) → first-member fallback
 *  5. a11y wiring: data-lawlib-member/trigger, aria-haspopup/controls/expanded
 *     on member buttons; popover role="dialog" aria-modal="false" + id;
 *     aria-describedby = tooltip id iff open
 *  6. non-card key ref → FULL switch + jump (existing behavior kept)
 *  7. openCardPopover from a collapsed chapter group → auto-expand + 50ms
 *     scroll + popover; Esc within the 50ms window cancels the pending open
 *     (Track E NIT token)
 *  8. X close → focus restore to the member (same as Esc)
 *
 * jsdom gaps stubbed (mirroring reading-dock + Track E additions):
 *  - matchMedia (theme + tooltip sheet check)
 *  - IntersectionObserver (TocSidebar/DigestToc scroll-spy)
 *  - localStorage (in-memory store)
 *  - Element.prototype.scrollIntoView — jsdom has NO implementation (probe:
 *    typeof undefined) and every jump/open path calls it
 *  - window.CSS — jsdom 29 does not expose CSS.escape; the reader uses it in
 *    querySelector selectors (digits-only keys in this fixture → identity)
 *  - offsetParent: jsdom has no layout (ALWAYS null, even for visible
 *    elements — probe). restoreMemberFocus's hidden-guard
 *    (`el.offsetParent !== null`) needs the browser contract, so visible
 *    member buttons get a non-null offsetParent; hidden ones (collapsed
 *    groups) keep jsdom's null → the first-member fallback path is exercised
 *    for real.
 *
 * `next/link` renders a plain <a> (no router in jsdom — reading-dock pattern).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import LawlibReaderClient from '@/app/(website)/lawlib/[slug]/LawlibReaderClient';
import { ThemeProvider } from '@/components/ThemeProvider';
import { parseDigestMd } from '@/lib/lawlib/parser';
import { buildView, type DigestView } from '@/lib/lawlib/digest-view';
import { glossaryIndex } from '@/lib/lawlib-reader';
import type { LawDoc } from '@/types/lawlib';

vi.mock('next/link', () => ({
  default: (props: { href: string; children?: ReactNode }) => (
    <a href={props.href}>{props.children}</a>
  ),
}));

// ---------------------------------------------------------------------------
// Fixture: one law + one small digest (mirrors the real page pairing)
// ---------------------------------------------------------------------------

const law: LawDoc = {
  slug: 'compact-routing-test',
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
        {
          no: 11,
          text: [{ kind: 'text', t: 'ให้จัดการศึกษาขั้นพื้นฐานแก่ผู้เรียน' }],
          amendedBy: [{ editionNo: 2, note: 'ฉบับที่ 2 (2545) - แก้ไข: เนื้อความมาตรา 11' }],
        },
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

const DIGEST_MD = `# พจนานุกรมกฎหมาย — ทดสอบ

## 1. ข้อมูลกฎหมาย

- **ชื่อ:** พระราชบัญญัติทดสอบ พ.ศ. 2545
- **ประกาศ:** ราชกิจจานุเบกษา

## 2. ประวัติการแก้ไข

**ฉบับที่ 1 (2545):** ประกาศใช้ครั้งแรก
**ฉบับที่ 2 (2545):** แก้ไข [[มาตรา 99]]

## 3. คำนิยามสำคัญ

**มาตรา 4** : คำนิยามความหมาย

## 4. มาตราสำคัญ

**มาตรา 5** : ให้ผู้ปกครองส่งเด็กเข้าเรียนในสถานศึกษา
**มาตรา 6** : ให้สถานศึกษาจัดการศึกษา
**มาตรา 7** : ผู้ปกครองที่ไม่ปฏิบัติตาม[[มาตรา 5]] มีความผิด
**มาตรา 11 - มาตรา 12** : เนื้อความรวมมาตรา 11 และ 12
**มาตรา 13** : ผู้ใดไม่อำนวยความสะดวกตาม[[มาตรา 12]] และ[[มาตรา 71]] หรือ[[มาตรา 99]] มีความผิด
### บทเฉพาะกาล
**มาตรา 70** : บทเฉพาะกาลฉบับหนึ่ง
**มาตรา 71** : บทเฉพาะกาลฉบับสอง
`;

/** Mirrors page.tsx buildDigestView: parse md → buildView with the law's
 *  chapter table + glossary index (page runs this server-side; the test
 *  builds the same DigestView in-memory). */
function buildDigestView(): DigestView {
  const doc = parseDigestMd(DIGEST_MD);
  return buildView(
    doc,
    new Map(),
    law.chapters.map((ch) => ({
      no: ch.no,
      title: ch.title,
      articleKeys: [
        ...ch.articles.map((a) => `${a.no}${a.suffix ?? ''}`),
        ...(ch.sections ?? []).flatMap((s) => s.articles.map((a) => `${a.no}${a.suffix ?? ''}`)),
      ],
    })),
    glossaryIndex(law),
    { slug: law.slug, href: `/lawlib/${law.slug}` },
  );
}

const digestView = buildDigestView();

// ---------------------------------------------------------------------------
// jsdom stubs (reading-dock precedents + Track E additions)
// ---------------------------------------------------------------------------

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

function mockMatchMedia(matches: boolean): void {
  const mql = {
    matches,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
}

class IntersectionObserverStub {
  readonly root: Element | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

/**
 * jsdom has NO layout: Element.offsetParent is ALWAYS null (probe, jsdom 29).
 * restoreMemberFocus's hidden-guard reads it, so emulate the browser contract
 * for VISIBLE member buttons (non-null). Hidden members (collapsed group via
 * the `hidden` attribute — jsdom's UA sheet maps it to display:none) keep
 * jsdom's null → the first-member fallback path is genuinely exercised.
 */
function stubVisibleOffsetParents(): void {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-lawlib-member]'))) {
    if (el.closest('[hidden]') !== null) continue;
    Object.defineProperty(el, 'offsetParent', { configurable: true, value: document.body });
  }
}

beforeEach(() => {
  mockLocalStorage();
  mockMatchMedia(false);
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  // jsdom has no scrollIntoView (probe: undefined) — every jump/open path calls it.
  Element.prototype.scrollIntoView = vi.fn();
  // jsdom 29 does not expose CSS.escape (probe: window.CSS undefined); the
  // reader's selectors only ever escape digits in this fixture.
  window.CSS = { escape: (s: string) => s } as unknown as typeof CSS;
  // jsdom keeps ONE window (and URL) for the whole file — a FULL-jump test's
  // replaceState('#มาตรา-…') would otherwise poison every later render's
  // mount effect (hash deep-link → force FULL). Fresh-load isolation.
  window.history.replaceState(null, '', '/');
  document.documentElement.className = '';
  document.documentElement.removeAttribute('data-paper-tone');
  document.body.classList.remove('lawlib-immersive');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const memberBtn = (key: string) =>
  document.querySelector<HTMLButtonElement>(`[data-lawlib-member="${key}"]`);
const popover = () => document.querySelector<HTMLElement>('[data-lawlib-popover]');
const tooltipRoot = () => document.body.querySelector<HTMLElement>('[role="tooltip"]');
const compactCard = (key: string) =>
  document.querySelector<HTMLElement>(`[data-lawlib-card="${key}"]`);

/** The same-law ref BUTTON inside a card's body (scoped — TOC chips and
 *  member buttons share the 'มาตรา N' accessible names). */
function bodyRefButton(cardKey: string, label: string): HTMLButtonElement {
  const card = compactCard(cardKey);
  expect(card).not.toBeNull();
  const btn = Array.from(card!.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === label,
  );
  expect(btn, `ref button '${label}' inside card ${cardKey}`).not.toBeUndefined();
  return btn as HTMLButtonElement;
}

/** Flush the reader's 50ms open/scroll windows + setTimeout(0) focus restores. */
async function flush(ms = 80): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function renderReader() {
  const utils = render(
    <ThemeProvider>
      <LawlibReaderClient law={law} digestView={digestView} />
    </ThemeProvider>,
  );
  // The mount effect defers its work into setTimeout(0) — settle it inside act.
  await flush(10);
  stubVisibleOffsetParents();
  return utils;
}

// ---------------------------------------------------------------------------
// 1. Merged-member routing (BLOCKER pin: memberToCardMap not digestHasCard)
// ---------------------------------------------------------------------------

describe('merged-member routing', () => {
  it('body-ref to member 12 of "มาตรา 11 - มาตรา 12" opens the merged card popover (NO FULL switch)', async () => {
    await renderReader();

    fireEvent.click(bodyRefButton('13', 'มาตรา 12'));
    await flush();

    // popover for the MERGED card (key '11'), still in compact view
    expect(popover()).not.toBeNull();
    expect(compactCard('11')).not.toBeNull(); // compact still rendered → no FULL
    // stacked ArticleView: BOTH members render the REAL article text
    expect(popover()?.textContent).toContain('ให้จัดการศึกษาขั้นพื้นฐานแก่ผู้เรียน');
    expect(popover()?.textContent).toContain('จัดการศึกษาเป็นพิเศษสำหรับเด็กที่มีความบกพร่อง');
  });

  it('tooltip เปิดมาตรานี้ on a merged member opens the merged popover + closes the tooltip', async () => {
    await renderReader();

    // hover member 12 → ITS tooltip
    fireEvent.pointerEnter(memberBtn('12') as HTMLElement, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull();
    expect(memberBtn('12')?.getAttribute('aria-describedby')).toBeTruthy();

    fireEvent.click(screen.getByText('เปิดมาตรานี้'));
    await flush();

    expect(tooltipRoot()).toBeNull();
    expect(popover()).not.toBeNull();
    expect(compactCard('11')).not.toBeNull(); // merged card, not FULL
    expect(popover()?.textContent).toContain('ให้จัดการศึกษาขั้นพื้นฐานแก่ผู้เรียน');
    expect(popover()?.textContent).toContain('จัดการศึกษาเป็นพิเศษสำหรับเด็กที่มีความบกพร่อง');
  });

  it('merged members hover independently: 11 and 12 open THEIR OWN tooltips', async () => {
    await renderReader();
    const m11 = memberBtn('11') as HTMLElement;
    const m12 = memberBtn('12') as HTMLElement;

    fireEvent.pointerEnter(m11, { pointerType: 'mouse' });
    const tooltipId = tooltipRoot()?.id ?? '';
    expect(tooltipId.length).toBeGreaterThan(0);
    expect(m11.getAttribute('aria-describedby')).toBe(tooltipId);
    expect(m12.getAttribute('aria-describedby')).toBeNull();
    // the tooltip shows มาตรา 11's own article text (amended note)
    expect(tooltipRoot()?.textContent).toContain('แก้ไข: เนื้อความมาตรา 11');

    fireEvent.pointerLeave(m11, { pointerType: 'mouse' });
    expect(tooltipRoot()).toBeNull();

    fireEvent.pointerEnter(m12, { pointerType: 'mouse' });
    expect(m12.getAttribute('aria-describedby')).toBe(tooltipRoot()?.id ?? '');
    expect(m11.getAttribute('aria-describedby')).toBeNull();
    expect(tooltipRoot()?.textContent).toContain('จัดการศึกษาเป็นพิเศษสำหรับเด็กที่มีความบกพร่อง');
  });
});

// ---------------------------------------------------------------------------
// 2. Member click → popover EXACTLY ONCE + tooltip closed (double-fire guard)
// ---------------------------------------------------------------------------

describe('member click', () => {
  it('clicking a member label opens the popover exactly once and closes the tooltip', async () => {
    await renderReader();
    const m5 = memberBtn('5') as HTMLElement;

    // hover first → tooltip open (must not survive the click)
    fireEvent.pointerEnter(m5, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull();

    fireEvent.click(m5);
    await flush();

    // The loop-5 double-fire regression: if the whole-card onClick ALSO fired,
    // the toggle would have flipped the popover back to closed.
    expect(document.querySelectorAll('[data-lawlib-popover]').length).toBe(1);
    expect(tooltipRoot()).toBeNull();
    expect(m5.getAttribute('aria-expanded')).toBe('true');
    expect(popover()?.textContent).toContain('ให้ผู้ปกครองส่งเด็กเข้าเรียนในสถานศึกษา');
  });

  it('hovering the card BODY is inert — no popover (hover-open machinery deleted)', async () => {
    await renderReader();
    const body = compactCard('5')?.querySelector('p');
    expect(body).not.toBeNull();

    fireEvent.pointerEnter(body as HTMLElement, { pointerType: 'mouse' });
    await flush();
    expect(popover()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Guards: body-tap / term-tap / TOC chip
// ---------------------------------------------------------------------------

describe('tap guards', () => {
  it('body-tap (non-trigger area) opens the popover', async () => {
    await renderReader();
    const body = compactCard('5')?.querySelector('p') as HTMLElement;

    fireEvent.click(body);
    await flush();

    expect(popover()).not.toBeNull();
    expect(popover()?.textContent).toContain('ให้ผู้ปกครองส่งเด็กเข้าเรียนในสถานศึกษา');
  });

  it('term-tap opens the glossary tooltip only — no popover (closest-guard)', async () => {
    await renderReader();
    const term = compactCard('5')?.querySelector('[data-lawlib-term="สถานศึกษา"]') as HTMLElement;
    expect(term).not.toBeNull();

    fireEvent.click(term);
    await flush();

    expect(tooltipRoot()).not.toBeNull();
    expect(tooltipRoot()?.textContent).toContain('สถานศึกษาที่จัดการศึกษาภาคบังคับ');
    expect(popover()).toBeNull();
  });

  it('TOC chip click scrolls only — no popover, no FULL switch', async () => {
    await renderReader();
    const scrollIntoView = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>;
    // Section 3 (คำนิยามสำคัญ) is FLAT → its มาตรา 4 chip renders in the body
    // (grouped sections render no chips). Scope to the section: the TOC
    // sidebar's buttons live in <nav>, not here.
    const section = document.querySelector('section[aria-label="3. คำนิยามสำคัญ"]');
    const chip = Array.from(section?.querySelectorAll('button') ?? []).find(
      (b) => b.textContent?.trim() === 'มาตรา 4',
    );
    expect(chip).not.toBeUndefined();

    fireEvent.click(chip as HTMLButtonElement);
    await flush();

    expect(popover()).toBeNull();
    expect(compactCard('4')).not.toBeNull(); // compact preserved → no FULL
    expect(scrollIntoView).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4. Keyboard: Enter/Space → tooltip (popover closed); Esc sequences + restore
// ---------------------------------------------------------------------------

describe('keyboard', () => {
  it('Enter on a member button opens the keyboard-mode tooltip; popover stays closed', async () => {
    await renderReader();

    fireEvent.keyDown(memberBtn('5') as HTMLElement, { key: 'Enter' });
    await flush();

    expect(tooltipRoot()).not.toBeNull();
    expect(popover()).toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(tooltipRoot()).toBeNull();
    expect(popover()).toBeNull();
  });

  it('Space on a member button does the same (hook onKeyDown preserved)', async () => {
    await renderReader();

    fireEvent.keyDown(memberBtn('6') as HTMLElement, { key: ' ' });
    await flush();

    expect(tooltipRoot()).not.toBeNull();
    expect(popover()).toBeNull();
  });

  it('Esc one press closes tooltip AND popover, no reopen, focus back to the last member', async () => {
    await renderReader();

    // popover for card 5 (member click)
    fireEvent.click(memberBtn('5') as HTMLElement);
    await flush();
    expect(popover()).not.toBeNull();

    // tooltip for member 12 floats over the pinned popover (simultaneity rule)
    fireEvent.pointerEnter(memberBtn('12') as HTMLElement, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    await flush();

    expect(tooltipRoot()).toBeNull();
    expect(popover()).toBeNull();
    // restore = the LAST-CLICKED member (5), not the hovered one (12)
    expect(document.activeElement).toBe(memberBtn('5'));
    // no reopen after the restore flush (no onFocus in the hook)
    expect(tooltipRoot()).toBeNull();
    expect(popover()).toBeNull();
  });

  it('merged card Esc restores focus to the SECOND member (12)', async () => {
    await renderReader();

    fireEvent.click(memberBtn('12') as HTMLElement);
    await flush();
    expect(popover()).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    await flush();

    expect(popover()).toBeNull();
    expect(document.activeElement).toBe(memberBtn('12'));
  });

  it('hidden-guard: Esc on a card inside a re-collapsed group falls back to its first member', async () => {
    await renderReader();

    // open the collapsed บทเฉพาะกาล card 71 via the body-ref router
    fireEvent.click(bodyRefButton('13', 'มาตรา 71'));
    await flush();
    expect(popover()).not.toBeNull();
    // group auto-expanded by the router
    const region = document.getElementById('ch-x-1-region');
    expect(region?.hasAttribute('hidden')).toBe(false);

    // re-collapse the group while the popover stays pinned (click-pinned).
    // ch-1 (หมวดที่ 1) has NO h3 (auto-group from the chapter table) — the
    // ONLY h3 disclosure is บทเฉพาะกาล's; find it by its label.
    const section = document.querySelector('section[aria-label="มาตราสำคัญ"]');
    const disclosure = Array.from(section?.querySelectorAll('h3 button') ?? []).find((b) =>
      b.textContent?.includes('บทเฉพาะกาล'),
    ) as HTMLButtonElement;
    fireEvent.click(disclosure);
    expect(region?.hasAttribute('hidden')).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    await flush();

    expect(popover()).toBeNull();
    // hidden member → offsetParent null → first-member fallback (jsdom
    // focuses hidden elements, so the fallback target is observable)
    expect(document.activeElement).toBe(memberBtn('71'));
  });
});

// ---------------------------------------------------------------------------
// 5. A11y wiring
// ---------------------------------------------------------------------------

describe('a11y wiring', () => {
  it('member buttons carry the full APG two-relationship wiring; popover is role=dialog', async () => {
    await renderReader();
    const m5 = memberBtn('5') as HTMLElement;

    expect(m5.getAttribute('data-lawlib-member')).toBe('5');
    expect(m5.hasAttribute('data-lawlib-trigger')).toBe(true);
    expect(m5.getAttribute('aria-haspopup')).toBe('dialog');
    expect(m5.getAttribute('aria-expanded')).toBe('false');

    // merged card: two member buttons + the ' - ' separator (visual spacing
    // is the mx-2 class; textContent concatenates without spaces)
    const merged = compactCard('11') as HTMLElement;
    const members = merged.querySelectorAll('[data-lawlib-member]');
    expect(members.length).toBe(2);
    expect(merged.textContent).toContain('มาตรา 11-มาตรา 12');

    // open the popover → aria-controls points at the REAL dialog id, and
    // aria-expanded flips on BOTH members of the open card
    fireEvent.click(m5);
    await flush();
    const dialog = popover();
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('false');
    expect(dialog?.id.length).toBeGreaterThan(0);
    expect(m5.getAttribute('aria-controls')).toBe(dialog?.id ?? '');
    expect(m5.getAttribute('aria-expanded')).toBe('true');
    expect(memberBtn('6')?.getAttribute('aria-expanded')).toBe('false');
    expect(memberBtn('12')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('aria-describedby = tooltip id iff open (per member)', async () => {
    await renderReader();
    const m5 = memberBtn('5') as HTMLElement;
    const m6 = memberBtn('6') as HTMLElement;

    expect(m5.getAttribute('aria-describedby')).toBeNull();
    fireEvent.pointerEnter(m5, { pointerType: 'mouse' });
    const tooltipId = tooltipRoot()?.id ?? '';
    expect(m5.getAttribute('aria-describedby')).toBe(tooltipId);
    expect(m6.getAttribute('aria-describedby')).toBeNull();
    fireEvent.pointerLeave(m5, { pointerType: 'mouse' });
    expect(m5.getAttribute('aria-describedby')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. Non-card keys keep the FULL fallback
// ---------------------------------------------------------------------------

describe('non-card key routing (FULL fallback)', () => {
  it('body-ref to an article with no digest card → FULL switch + jump, no popover', async () => {
    await renderReader();
    const scrollIntoView = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>;

    fireEvent.click(bodyRefButton('13', 'มาตรา 99'));
    await flush();

    expect(popover()).toBeNull();
    // compact unmounted → FULL rendered the real article
    expect(document.querySelector('[data-lawlib-card]')).toBeNull();
    expect(document.getElementById('มาตรา-99')).not.toBeNull();
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('tooltip เปิดมาตรานี้ on a non-card ref (history block) → FULL switch, no popover', async () => {
    await renderReader();
    // Section 2 (ประวัติการแก้ไข) renders in the reader HEADER, collapsed by
    // default — expand it; its refs are interactive={false} spans
    // (role=button, data-lawlib-trigger) that render BEFORE the compact body.
    fireEvent.click(screen.getByRole('button', { name: /ประวัติการแก้ไข/ }));
    const historyRef = document.querySelector('[data-lawlib-trigger]');
    expect(historyRef).not.toBeNull();
    expect(historyRef?.textContent).toBe('มาตรา 99');

    fireEvent.pointerEnter(historyRef as HTMLElement, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull();
    expect(tooltipRoot()?.textContent).toContain('มาตรา 99');

    fireEvent.click(screen.getByText('เปิดมาตรานี้'));
    await flush();

    expect(tooltipRoot()).toBeNull();
    expect(popover()).toBeNull();
    expect(document.querySelector('[data-lawlib-card]')).toBeNull(); // FULL
    expect(document.getElementById('มาตรา-99')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. openCardPopover mechanics: collapsed group + 50ms race
// ---------------------------------------------------------------------------

describe('openCardPopover mechanics', () => {
  it('member ref inside a collapsed chapter group auto-expands the group, then opens the popover', async () => {
    await renderReader();
    const scrollIntoView = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>;
    const region = document.getElementById('ch-x-1-region');
    expect(region?.hasAttribute('hidden')).toBe(true); // collapsed at mount

    fireEvent.click(bodyRefButton('13', 'มาตรา 71'));

    // group expansion is SYNCHRONOUS (before the 50ms scroll/open window)
    expect(region?.hasAttribute('hidden')).toBe(false);

    // popover NOT open yet (50ms pending)
    expect(popover()).toBeNull();

    await flush();
    expect(popover()).not.toBeNull();
    expect(popover()?.textContent).toContain('บทเฉพาะกาลฉบับสอง');
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('Esc within the 50ms window cancels the pending open (Track E NIT token)', async () => {
    await renderReader();

    // schedule an open for card 71 (50ms pending)
    fireEvent.click(bodyRefButton('13', 'มาตรา 71'));
    // immediately open card 5 via a direct member click (sync toggle)
    fireEvent.click(memberBtn('5') as HTMLElement);
    expect(popover()).not.toBeNull();

    // close within the window → the pending 71-open must NOT re-open anything
    fireEvent.keyDown(document, { key: 'Escape' });
    await flush();

    expect(popover()).toBeNull();
    expect(tooltipRoot()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 8. X close restores focus (same as Esc)
// ---------------------------------------------------------------------------

describe('popover close', () => {
  it('X button close restores focus to the clicked member', async () => {
    await renderReader();

    fireEvent.click(memberBtn('6') as HTMLElement);
    await flush();
    expect(popover()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'ปิด' }));
    await flush();

    expect(popover()).toBeNull();
    expect(document.activeElement).toBe(memberBtn('6'));
  });
});

// ---------------------------------------------------------------------------
// Bonus pins (plan v6 AC1): tooltip content parity — amended vs not
// ---------------------------------------------------------------------------

describe('tooltip content parity', () => {
  it('amended member shows the ประวัติการแก้ไข note; non-amended shows full text, no history', async () => {
    await renderReader();

    fireEvent.pointerEnter(memberBtn('11') as HTMLElement, { pointerType: 'mouse' });
    expect(tooltipRoot()?.textContent).toContain('ฉบับที่ 2 (2545) - แก้ไข: เนื้อความมาตรา 11');
    fireEvent.pointerLeave(memberBtn('11') as HTMLElement, { pointerType: 'mouse' });

    fireEvent.pointerEnter(memberBtn('5') as HTMLElement, { pointerType: 'mouse' });
    expect(tooltipRoot()?.textContent).toContain('ให้ผู้ปกครองส่งเด็กเข้าเรียนในสถานศึกษา');
    // no amendment list on a non-amended article
    expect(tooltipRoot()?.querySelector('ul')).toBeNull();
  });
});
