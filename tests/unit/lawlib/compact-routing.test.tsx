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
 *    member buttons get a non-null offsetParent; members in collapsed groups
 *    (T35: grid rows 0fr + `inert`; formerly the `hidden` attribute) keep
 *    jsdom's null → the first-member fallback path is exercised for real.
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

**มาตรา 5** : ให้ผู้ปกครองส่งเด็กเข้าเรียนในสถานศึกษา ตาม[[มาตรา 6]]
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

function mockMatchMedia(matches: boolean, reducedMotion = false): void {
  const makeMql = (media: string) =>
    ({
      matches: media.includes('prefers-reduced-motion') ? reducedMotion : matches,
      media,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
  window.matchMedia = vi.fn((media: string) =>
    makeMql(String(media)),
  ) as unknown as typeof window.matchMedia;
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
 * for VISIBLE member buttons (non-null). Members inside a collapsed group
 * (grid rows 0fr + the `inert` attribute — T35, ADR-024 D3; previously the
 * `hidden` attribute) keep jsdom's null → the first-member fallback path is
 * genuinely exercised.
 */
function stubVisibleOffsetParents(): void {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-lawlib-member]'))) {
    if (el.closest('[inert]') !== null) continue;
    Object.defineProperty(el, 'offsetParent', { configurable: true, value: document.body });
  }
}

beforeEach(() => {
  mockLocalStorage();
  // reduced-motion ON: this file pins compact ROUTING semantics (tooltip
  // close → popover / FULL switch), not the T28 exit animation — closes must
  // stay synchronous as before T28 (the tooltip suite covers the 120ms exit).
  mockMatchMedia(false, true);
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
// Role-agnostic: with the reader's hub present the tooltip root is
// role=dialog (a11y fix #7); without a hub it stays role=tooltip.
const tooltipRoot = () => document.body.querySelector<HTMLElement>('.lawlib-tooltip');
const compactCard = (key: string) =>
  document.querySelector<HTMLElement>(`[data-lawlib-card="${key}"]`);

// T35 (ADR-024 D3): a group region is an always-rendered grid WRAPPER
// (`${group.id}-region` — identity must persist, TOC scroll targets) whose
// rows interpolate 0fr ↔ 1fr 400ms --ease-ios-out; the inner
// overflow-hidden div owns `inert` (collapsed) + lawlib-fade-rise 150ms
// (expanded only).
const regionInner = (region: HTMLElement) => region.firstElementChild as HTMLElement;
function expectRegionCollapsed(region: HTMLElement | null): void {
  expect(region).not.toBeNull();
  expect(region!.style.gridTemplateRows).toBe('0fr');
  expect(regionInner(region!).hasAttribute('inert')).toBe(true);
  expect(regionInner(region!).className).not.toContain('lawlib-fade-rise');
}
function expectRegionExpanded(region: HTMLElement | null): void {
  expect(region).not.toBeNull();
  expect(region!.style.gridTemplateRows).toBe('1fr');
  expect(region!.style.transition).toContain('grid-template-rows');
  expect(region!.style.transition).toContain('400ms');
  // T42 (ADR-025 D2): the inline transition rides --motion-factor.
  expect(region!.style.transition).toContain('var(--motion-factor');
  expect(regionInner(region!).hasAttribute('inert')).toBe(false);
  expect(regionInner(region!).className).toContain('lawlib-fade-rise');
  expect(regionInner(region!).style.animationDuration).toBe(
    'calc(150ms * var(--motion-factor, 1))',
  );
}

/** The same-law ref TRIGGER inside a card's body (scoped — TOC chips and
 *  member buttons share the 'มาตรา N' accessible names; member buttons are
 *  excluded via data-lawlib-member). T11: body refs are inline tooltip
 *  triggers (span role=button + data-lawlib-trigger), not <button>s. */
function bodyRefTrigger(cardKey: string, label: string): HTMLElement {
  const card = compactCard(cardKey);
  expect(card).not.toBeNull();
  const el = Array.from(card!.querySelectorAll<HTMLElement>('[data-lawlib-trigger]')).find(
    (b) => b.textContent?.trim() === label && !b.hasAttribute('data-lawlib-member'),
  );
  expect(el, `ref trigger '${label}' inside card ${cardKey}`).not.toBeUndefined();
  return el as HTMLElement;
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
  it('digest-ref to member 12 of "มาตรา 11 - มาตรา 12" → ฉบับย่อ tooltip; ดูฉบับเต็ม opens the merged card popover (NO FULL switch)', async () => {
    await renderReader();

    fireEvent.click(bodyRefTrigger('13', 'มาตรา 12'));
    await flush();

    // click pins the digest tooltip — the MERGED card's summary (ฉบับย่อ)
    expect(tooltipRoot()).not.toBeNull();
    expect(tooltipRoot()?.textContent).toContain('เนื้อความรวมมาตรา 11 และ 12');

    // ดูฉบับเต็ม → the merged card's popover, compact still rendered
    fireEvent.click(screen.getByRole('button', { name: 'ดูฉบับเต็ม' }));
    await flush();

    expect(tooltipRoot()).toBeNull();
    expect(popover()).not.toBeNull();
    expect(compactCard('11')).not.toBeNull(); // compact still rendered → no FULL
    // T17: the popover is a content-glass surface (slider-driven fill + blur)
    expect(popover()?.className).toContain('lawlib-glass-content');
    expect(popover()?.className).toContain('lawlib-glass-sheen');
    expect(popover()?.className).not.toContain('bg-white');
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

    // open the collapsed บทเฉพาะกาล card 71 via the digest-ref → ดูฉบับเต็ม
    fireEvent.click(bodyRefTrigger('13', 'มาตรา 71'));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'ดูฉบับเต็ม' }));
    await flush();
    expect(popover()).not.toBeNull();
    // group auto-expanded by the router
    const region = document.getElementById('ch-x-1-region');
    expectRegionExpanded(region);

    // re-collapse the group while the popover stays pinned (click-pinned).
    // ch-1 (หมวดที่ 1) has NO h3 (auto-group from the chapter table) — the
    // ONLY h3 disclosure is บทเฉพาะกาล's; find it by its label.
    const section = document.querySelector('section[aria-label="มาตราสำคัญ"]');
    const disclosure = Array.from(section?.querySelectorAll('h3 button') ?? []).find((b) =>
      b.textContent?.includes('บทเฉพาะกาล'),
    ) as HTMLButtonElement;
    fireEvent.click(disclosure);
    expectRegionCollapsed(region);

    fireEvent.keyDown(document, { key: 'Escape' });
    await flush();

    expect(popover()).toBeNull();
    // member in the collapsed group → offsetParent null (emulated) →
    // first-member fallback (jsdom focuses hidden elements, so the fallback
    // target is observable)
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
  it('digest-ref to an article with no digest card → ฉบับย่อ falls back to the full text; ดูฉบับเต็ม → FULL switch + jump', async () => {
    await renderReader();
    const scrollIntoView = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>;

    fireEvent.click(bodyRefTrigger('13', 'มาตรา 99'));
    await flush();

    // pinned digest tooltip; มาตรา 99 has no card → the law JSON text fallback
    expect(tooltipRoot()).not.toBeNull();
    expect(tooltipRoot()?.textContent).toContain('บทเฉพาะกาลของฉบับเต็ม');

    fireEvent.click(screen.getByRole('button', { name: 'ดูฉบับเต็ม' }));
    await flush();

    expect(tooltipRoot()).toBeNull();
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
    expectRegionCollapsed(region); // collapsed at mount

    // pin the มาตรา 71 digest tooltip, then ดูฉบับเต็ม routes to the popover
    fireEvent.click(bodyRefTrigger('13', 'มาตรา 71'));
    await flush();
    expect(tooltipRoot()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'ดูฉบับเต็ม' }));

    // group expansion is SYNCHRONOUS (before the 50ms scroll/open window)
    expectRegionExpanded(region);

    // popover NOT open yet (50ms pending)
    expect(popover()).toBeNull();

    await flush();
    expect(popover()).not.toBeNull();
    expect(popover()?.textContent).toContain('บทเฉพาะกาลฉบับสอง');
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('Esc within the 50ms window cancels the pending open (Track E NIT token)', async () => {
    await renderReader();

    // pin the มาตรา 71 digest tooltip and schedule its popover open (50ms)
    fireEvent.click(bodyRefTrigger('13', 'มาตรา 71'));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'ดูฉบับเต็ม' }));
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

// ---------------------------------------------------------------------------
// T11 — COMPACT inline "มาตรา X" digest-ref tooltips (ฉบับย่อ + ดูฉบับเต็ม)
// ---------------------------------------------------------------------------

describe('T11 — digest-ref inline tooltips', () => {
  it('hovering a same-law ref shows the digest ฉบับย่อ (NOT the full text); aria-expanded flips; no popover', async () => {
    await renderReader();
    const ref = bodyRefTrigger('13', 'มาตรา 12');
    expect(ref.getAttribute('aria-expanded')).toBe('false');

    fireEvent.pointerEnter(ref, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull();
    expect(ref.getAttribute('aria-expanded')).toBe('true');
    // the snippet is the MERGED card's summary — the full มาตรา 12 text must
    // NOT leak into the preview (that is the ArticleBody/ดูฉบับเต็ม path)
    expect(tooltipRoot()?.textContent).toContain('เนื้อความรวมมาตรา 11 และ 12');
    expect(tooltipRoot()?.textContent).not.toContain(
      'จัดการศึกษาเป็นพิเศษสำหรับเด็กที่มีความบกพร่อง',
    );
    // the ดูฉบับเต็ม action is present; hover never opens the popover
    expect(screen.getByRole('button', { name: 'ดูฉบับเต็ม' })).not.toBeNull();
    expect(popover()).toBeNull();

    // hover-leave closes the preview (jsdom zero rects → instant close)
    fireEvent.pointerLeave(ref, { pointerType: 'mouse' });
    expect(tooltipRoot()).toBeNull();
    expect(ref.getAttribute('aria-expanded')).toBe('false');
  });

  it('click pins the digest tooltip — pointerleave does NOT close; Esc does', async () => {
    await renderReader();
    const ref = bodyRefTrigger('13', 'มาตรา 12');

    fireEvent.pointerDown(ref, { pointerType: 'mouse' });
    fireEvent.pointerUp(ref, { pointerType: 'mouse' });
    fireEvent.click(ref);
    expect(tooltipRoot()).not.toBeNull();
    expect(ref.getAttribute('aria-expanded')).toBe('true');

    fireEvent.pointerLeave(ref, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull(); // pinned → sticky

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(tooltipRoot()).toBeNull();
    expect(ref.getAttribute('aria-expanded')).toBe('false');
  });

  it('repealed ref → ถูกยกเลิก badge in the snippet', async () => {
    await renderReader();
    fireEvent.pointerEnter(bodyRefTrigger('5', 'มาตรา 6'), { pointerType: 'mouse' });
    expect(tooltipRoot()?.textContent).toContain('มาตรา 6');
    expect(tooltipRoot()?.textContent).toContain('ถูกยกเลิก');
    expect(tooltipRoot()?.textContent).toContain('ให้สถานศึกษาจัดการศึกษา');
  });

  it('keyboard: Enter on a ref opens the tooltip and moves focus into it', async () => {
    await renderReader();
    const ref = bodyRefTrigger('13', 'มาตรา 71');
    ref.focus();

    fireEvent.keyDown(ref, { key: 'Enter' });
    await flush();

    expect(tooltipRoot()).not.toBeNull();
    expect(tooltipRoot()?.textContent).toContain('บทเฉพาะกาลฉบับสอง');
    // keyboard-mode → focus lands in the tooltip root (Tab cycles its actions)
    expect(document.activeElement).toBe(tooltipRoot());

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(tooltipRoot()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T9 mobile batch — popover viewport clamp / explicit ?view= param / TOC
// collapse / drawer search focus
// ---------------------------------------------------------------------------

describe('T9 — popover viewport clamp', () => {
  it('pulls the popover top up so the bottom edge clears a short viewport', async () => {
    // jsdom has no layout: stub EVERY getBoundingClientRect with a tall
    // content measure (tooltip.test.tsx precedent) + a 400px viewport. The
    // lazy position lands at top 100 (side branch); the real 500px height
    // would push the bottom edge to 600 > 400 — the mount clamp must pull
    // the top to 8px (400 - 500 - 12, floored at 8).
    Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true });
    const rect = {
      top: 100,
      left: 100,
      bottom: 600,
      right: 400,
      height: 500,
      width: 300,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    };
    const spy = vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue(rect as DOMRect);
    try {
      await renderReader();
      fireEvent.click(memberBtn('5') as HTMLElement);
      await flush();
      const dialog = popover();
      expect(dialog).not.toBeNull();
      expect(dialog?.style.top).toBe('8px');
    } finally {
      spy.mockRestore();
      Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
    }
  });
});

describe('T9 — explicit ?view= respected at mount', () => {
  it('?view=compact + a non-card hash stays compact (no auto-FULL switch)', async () => {
    window.history.replaceState(null, '', '/?view=compact#มาตรา-99');
    try {
      await renderReader();
      // Compact preserved: cards still rendered, no FULL article element,
      // no popover — the explicit view param wins over the jump rule.
      expect(document.querySelector('[data-lawlib-card]')).not.toBeNull();
      expect(document.getElementById('มาตรา-99')).toBeNull();
      expect(popover()).toBeNull();
    } finally {
      window.history.replaceState(null, '', '/');
    }
  });
});

describe('T9 — DigestToc mobile collapse', () => {
  it('below lg the TOC collapses behind a toggle and caps at 50vh', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    try {
      await renderReader();
      const toggle = screen.getByRole('button', { name: 'สารบัญ' });
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      const wrapper = document.querySelector('.lawlib-toc > div');
      expect(wrapper?.className).toContain('hidden');
      const list = wrapper?.querySelector('ul');
      expect(list?.className).toContain('max-h-[50vh]');

      fireEvent.click(toggle);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(wrapper?.className).not.toContain('hidden');
    } finally {
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    }
  });
});

describe('T9 — drawer focus lands in the search input', () => {
  it('opening the search panel focuses #lawlib-search-input, not the close button', async () => {
    await renderReader();
    // Level 1 is OPEN BY DEFAULT (T12) — the search tool is directly reachable.
    fireEvent.click(screen.getByRole('button', { name: 'ค้นหามาตรา' }));
    expect(document.activeElement).toBe(document.getElementById('lawlib-search-input'));
  });
});

// ---------------------------------------------------------------------------
// T13 — merged-ref splitting (range expansion + prose ranges + repealed badge)
// ---------------------------------------------------------------------------

/** T13 fixture law: the shared fixture + articles 32/1, 32/2, 75-78 so a
 *  "มาตรา 75 - มาตรา 78" card can span a REAL 4-article range (the digest
 *  parser stores only the endpoints as keys). */
const t13Law: LawDoc = {
  ...law,
  chapters: [
    {
      ...law.chapters[0],
      articles: [
        ...law.chapters[0].articles,
        { no: 32, suffix: '/1', text: [{ kind: 'text', t: 'สาระของมาตรา 32/1' }] },
        { no: 32, suffix: '/2', text: [{ kind: 'text', t: 'สาระของมาตรา 32/2' }] },
        { no: 75, text: [{ kind: 'text', t: 'สาระของมาตรา 75' }] },
        { no: 76, text: [{ kind: 'text', t: 'สาระของมาตรา 76' }] },
        { no: 77, text: [{ kind: 'text', t: 'สาระของมาตรา 77' }] },
        { no: 78, text: [{ kind: 'text', t: 'สาระของมาตรา 78' }] },
      ],
    },
    law.chapters[1],
  ],
};

const T13_DIGEST_MD = `# พจนานุกรมกฎหมาย — ทดสอบ

## 1. ข้อมูลกฎหมาย

- **ชื่อ:** พระราชบัญญัติทดสอบ พ.ศ. 2545

## 2. ประวัติการแก้ไข

**ฉบับที่ 1 (2545):** ประกาศใช้ครั้งแรก

## 4. มาตราสำคัญ

**มาตรา 5** : ให้ผู้ปกครองส่งเด็กเข้าเรียนในสถานศึกษา
**มาตรา 75 - มาตรา 78** : สาระรวมมาตรา 75 ถึง 78
**มาตรา 32/1 - มาตรา 32/2** : สาระรวมมาตรา 32/1 และ 32/2
**มาตรา 13** : ผู้ใดไม่อำนวยความสะดวก ตามมาตรา 75–76 และภายใต้ พ.ร.บ.ทดสอบ 2550 มาตรา 30–31 มีความผิด
### บทเฉพาะกาล
**มาตรา 70** : บทเฉพาะกาลฉบับหนึ่ง
**มาตรา 71** : บทเฉพาะกาลฉบับสอง
`;

function buildT13DigestView(): DigestView {
  const doc = parseDigestMd(T13_DIGEST_MD);
  return buildView(
    doc,
    new Map(),
    t13Law.chapters.map((ch) => ({
      no: ch.no,
      title: ch.title,
      articleKeys: [
        ...ch.articles.map((a) => `${a.no}${a.suffix ?? ''}`),
        ...(ch.sections ?? []).flatMap((s) => s.articles.map((a) => `${a.no}${a.suffix ?? ''}`)),
      ],
    })),
    glossaryIndex(t13Law),
    { slug: t13Law.slug, href: `/lawlib/${t13Law.slug}` },
  );
}

const t13DigestView = buildT13DigestView();

async function renderT13Reader() {
  const utils = render(
    <ThemeProvider>
      <LawlibReaderClient law={t13Law} digestView={t13DigestView} />
    </ThemeProvider>,
  );
  await flush(10);
  stubVisibleOffsetParents();
  return utils;
}

describe('T13 — merged-range card headers', () => {
  it('expands "มาตรา 75 - มาตรา 78" into FOUR member links (75,76,77,78), each with its own tooltip content', async () => {
    await renderT13Reader();
    const card = compactCard('75');
    expect(card).not.toBeNull();
    // four member buttons, one per law-present article in the range
    const members = Array.from(card!.querySelectorAll('[data-lawlib-member]'));
    expect(members.map((m) => m.getAttribute('data-lawlib-member'))).toEqual([
      '75',
      '76',
      '77',
      '78',
    ]);
    expect(members.map((m) => m.textContent?.trim())).toEqual([
      'มาตรา 75',
      'มาตรา 76',
      'มาตรา 77',
      'มาตรา 78',
    ]);
    // the digest routing attribute stays the DIGEST keys (routing contract)
    expect(card!.getAttribute('data-lawlib-card-members')).toBe('75 78');
  });

  it('hovering an EXPANDED member (76) shows its FULL article text (no digest snippet) + เปิดมาตรานี้', async () => {
    await renderT13Reader();
    fireEvent.pointerEnter(memberBtn('76') as HTMLElement, { pointerType: 'mouse' });
    expect(tooltipRoot()).not.toBeNull();
    // ArticleBody fallback — the FULL article text, NOT the merged summary
    expect(tooltipRoot()?.textContent).toContain('สาระของมาตรา 76');
    expect(tooltipRoot()?.textContent).not.toContain('สาระรวมมาตรา 75 ถึง 78');
    fireEvent.pointerLeave(memberBtn('76') as HTMLElement, { pointerType: 'mouse' });
  });

  it('clicking an expanded member opens the merged popover with ALL FOUR real articles stacked', async () => {
    await renderT13Reader();
    fireEvent.click(memberBtn('76') as HTMLElement);
    expect(popover()).not.toBeNull();
    // the popover stacks every member's REAL article (T13 expansion)
    for (const n of ['75', '76', '77', '78']) {
      expect(popover()?.textContent).toContain(`สาระของมาตรา ${n}`);
    }
  });

  it('suffixed merged card "มาตรา 32/1 - มาตรา 32/2" stays TWO discrete members (no range expansion)', async () => {
    await renderT13Reader();
    const card = compactCard('32/1');
    expect(card).not.toBeNull();
    const members = Array.from(card!.querySelectorAll('[data-lawlib-member]'));
    expect(members.map((m) => m.getAttribute('data-lawlib-member'))).toEqual(['32/1', '32/2']);
    expect(card!.getAttribute('data-lawlib-card-members')).toBe('32/1 32/2');
  });
});

describe('T13 — inline prose ranges (มาตรา 75–76)', () => {
  it('splits "ตามมาตรา 75–76" into TWO hoverable triggers with full-text tooltips', async () => {
    await renderT13Reader();
    // inside card 13's body: two range triggers (member buttons excluded)
    const t75 = bodyRefTrigger('13', 'มาตรา 75');
    const t76 = bodyRefTrigger('13', 'มาตรา 76');
    expect(t75.getAttribute('data-lawlib-trigger')).not.toBeNull();
    expect(t76.getAttribute('aria-expanded')).toBe('false');

    fireEvent.pointerEnter(t76, { pointerType: 'mouse' });
    expect(tooltipRoot()?.textContent).toContain('สาระของมาตรา 76');
    fireEvent.pointerLeave(t76, { pointerType: 'mouse' });
  });

  it('cross-law guard: "พ.ร.บ.ทดสอบ 2550 มาตรา 30–31" stays plain text (no triggers)', async () => {
    await renderT13Reader();
    const card = compactCard('13');
    expect(card).not.toBeNull();
    // the guarded range must NOT become triggers
    const triggers = Array.from(card!.querySelectorAll('[data-lawlib-trigger]'));
    expect(triggers.some((t) => t.textContent?.trim() === 'มาตรา 30')).toBe(false);
    expect(triggers.some((t) => t.textContent?.trim() === 'มาตรา 31')).toBe(false);
    // ... but the UNGUARDED range in the same line still splits
    expect(triggers.some((t) => t.textContent?.trim() === 'มาตรา 75')).toBe(true);
    expect(triggers.some((t) => t.textContent?.trim() === 'มาตรา 76')).toBe(true);
    // the plain text survives verbatim
    expect(card!.textContent).toContain('มาตรา 30–31');
  });

  it('keyboard: Enter on a prose-range trigger opens the tooltip and moves focus', async () => {
    await renderT13Reader();
    const t76 = bodyRefTrigger('13', 'มาตรา 76');
    t76.focus();
    fireEvent.keyDown(t76, { key: 'Enter' });
    await flush();
    expect(tooltipRoot()).not.toBeNull();
    expect(t76.getAttribute('aria-expanded')).toBe('true');
    // focus moves INTO the tooltip (keyboard-open contract)
    expect(tooltipRoot()?.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(tooltipRoot()).toBeNull();
  });

  it('repealed article hover shows the ถูกยกเลิก badge via the ArticleBody fallback', async () => {
    await renderReader(); // shared fixture: article 6 has repealedParagraphs
    fireEvent.pointerEnter(memberBtn('6') as HTMLElement, { pointerType: 'mouse' });
    expect(tooltipRoot()?.textContent).toContain('ถูกยกเลิก');
    expect(tooltipRoot()?.textContent).toContain('ให้สถานศึกษาจัดการศึกษา');
    fireEvent.pointerLeave(memberBtn('6') as HTMLElement, { pointerType: 'mouse' });
  });
});

// ---------------------------------------------------------------------------
// T31 (ADR-023 D9 row 16 — compact group expand motion, AC-1) + T35
// (ADR-024 D3 — grid-rows height animation both directions)
// ---------------------------------------------------------------------------

describe('T31 + T35 — compact group expand/collapse motion (T31 AC-1, T35 D3)', () => {
  it('expand: rows 0fr→1fr 400ms + fade-rise 150ms; collapse: rows 1fr→0fr + inert (both directions animate); chevron springs', async () => {
    // Shared fixture: section 4 (มาตราสำคัญ) groups into ch-1 (บททั่วไป) +
    // the unnumbered บทเฉพาะกาล (ch-x-1). First group expanded, the rest
    // collapsed — compact is the digest default view.
    await renderReader();

    // A collapsed region: the grid wrapper sits at rows 0fr (always
    // rendered — no [hidden] attr, no display:none).
    const collapsedRegion = Array.from(
      document.querySelectorAll<HTMLElement>('[id$="-region"]'),
    ).find((r) => r.style.gridTemplateRows === '0fr');
    expect(collapsedRegion).not.toBeUndefined();
    const region = collapsedRegion!;
    const regionId = region.id;
    // The group header button sits in the h3 BEFORE the region div.
    const header = region.previousElementSibling?.querySelector('button') as HTMLButtonElement;
    expect(header).not.toBeNull();
    expect(header.getAttribute('aria-expanded')).toBe('false');

    // Chevron baseline: spring timing on the transform transition, pointing
    // down while collapsed (no rotate-180 yet).
    const chevron = header.querySelector('i') as HTMLElement;
    expect(chevron.className).toContain('transition-transform');
    expect(chevron.className).toContain('duration-200');
    expect(chevron.className).toContain('ease-ios-spring');
    expect(chevron.className).not.toContain('rotate-180');

    // Expand → the SAME region node goes 0fr→1fr (400ms ease-ios-out
    // declared on the wrapper — the reverse path animates too) and the inner
    // re-gains fade-rise 150ms (a class re-add restarts the animation; no
    // keyed remount — callers hold region references, compact-routing
    // contract).
    fireEvent.click(header);
    const region2 = document.getElementById(regionId) as HTMLElement;
    expect(region2).not.toBeNull();
    expectRegionExpanded(region2);
    expect(header.getAttribute('aria-expanded')).toBe('true');
    expect(header.querySelector('i')!.className).toContain('rotate-180');

    // Collapse → rows 1fr→0fr (no instant hidden — the transition stays
    // declared so the height animates both ways) + inner inert (a11y/focus
    // removal) + no fade-rise.
    fireEvent.click(header);
    expect(document.getElementById(regionId)!.style.gridTemplateRows).toBe('0fr');
    expect(document.getElementById(regionId)!.style.transition).toContain('400ms');
    expectRegionCollapsed(document.getElementById(regionId));
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(header.querySelector('i')!.className).not.toContain('rotate-180');
  });
});

// ---------------------------------------------------------------------------
// T31 (ADR-023 D9 row 14 — digest flash ring pulse, AC-4)
// ---------------------------------------------------------------------------

describe('T31 — digest flash (AC-4)', () => {
  it('digest-search jump: the dline gets flash + one-shot pulse classes (motion ON)', async () => {
    // The shared harness defaults to reduced-motion ON (routing suite) —
    // this test pins the ANIMATED variant, so flip motion off first.
    mockMatchMedia(false, false);
    await renderReader();

    fireEvent.click(screen.getByRole('button', { name: 'ค้นหามาตรา' }));
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'ผู้ปกครอง' } });
    await flush(300); // debounce → digest results render

    const result = screen.getAllByRole('button', { name: /ในเวอร์ชันย่อ/ })[0] as HTMLElement;
    expect(result).not.toBeUndefined();
    fireEvent.click(result);
    await flush(100); // the 50ms jump defer

    const flashed = document.querySelector<HTMLElement>('.lawlib-dline-flash');
    expect(flashed).not.toBeNull();
    expect(flashed!.classList.contains('lawlib-flash-pulse')).toBe(true);
  });

  it('reduced-motion: the jump keeps the focus cue but skips the flash classes (JS gate)', async () => {
    // Harness default: reduced-motion ON.
    await renderReader();

    fireEvent.click(screen.getByRole('button', { name: 'ค้นหามาตรา' }));
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'ผู้ปกครอง' } });
    await flush(300);

    const result = screen.getAllByRole('button', { name: /ในเวอร์ชันย่อ/ })[0] as HTMLElement;
    fireEvent.click(result);
    await flush(100);

    expect(document.querySelector('.lawlib-dline-flash')).toBeNull();
  });
});
